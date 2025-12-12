// Application State
const state = {
    members: [],
    startDate: null,
    sprintDuration: 2,
    availability: {} // { memberName: { 'YYYY-MM-DD': true/false } }
};

// DOM Elements
const elements = {
    startDate: document.getElementById('startDate'),
    sprintDuration: document.getElementById('sprintDuration'),
    memberName: document.getElementById('memberName'),
    addMemberBtn: document.getElementById('addMemberBtn'),
    membersList: document.getElementById('membersList'),
    availabilityMatrix: document.getElementById('availabilityMatrix'),
    generateBtn: document.getElementById('generateBtn'),
    resultsSection: document.getElementById('resultsSection'),
    resultsContainer: document.getElementById('resultsContainer'),
    copyBtn: document.getElementById('copyBtn')
};

// Initialize
function init() {
    // Set default start date to next Wednesday
    const nextWednesday = getNextWednesday();
    elements.startDate.value = nextWednesday.toISOString().split('T')[0];
    state.startDate = nextWednesday;

    // Event Listeners
    elements.addMemberBtn.addEventListener('click', addMember);
    elements.memberName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addMember();
    });
    elements.startDate.addEventListener('change', updateStartDate);
    elements.sprintDuration.addEventListener('change', updateSprintDuration);
    elements.generateBtn.addEventListener('click', generateAssignment);
    elements.copyBtn.addEventListener('click', copyToClipboard);
}

// Get next Wednesday from today
function getNextWednesday() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilWednesday = (3 - dayOfWeek + 7) % 7 || 7;
    const nextWed = new Date(today);
    nextWed.setDate(today.getDate() + daysUntilWednesday);
    return nextWed;
}

// Add team member
function addMember() {
    const name = elements.memberName.value.trim();
    if (!name) return;
    
    if (state.members.includes(name)) {
        alert('Este miembro ya está en la lista.');
        return;
    }

    state.members.push(name);
    state.availability[name] = {};
    elements.memberName.value = '';
    
    renderMembers();
    renderAvailabilityMatrix();
}

// Remove team member
function removeMember(name) {
    state.members = state.members.filter(m => m !== name);
    delete state.availability[name];
    
    renderMembers();
    renderAvailabilityMatrix();
}

// Render members list
function renderMembers() {
    if (state.members.length === 0) {
        elements.membersList.innerHTML = '<div class="empty-state">No hay miembros en el equipo. Agrega algunos para comenzar.</div>';
        return;
    }

    elements.membersList.innerHTML = state.members.map(member => `
        <div class="member-tag">
            <span>${member}</span>
            <button class="btn-danger" onclick="removeMember('${member}')">×</button>
        </div>
    `).join('');
}

// Update start date
function updateStartDate(e) {
    state.startDate = new Date(e.target.value);
    renderAvailabilityMatrix();
}

// Update sprint duration
function updateSprintDuration(e) {
    state.sprintDuration = parseInt(e.target.value);
    renderAvailabilityMatrix();
}

// Get sprint days (excluding weekends)
function getSprintDays() {
    if (!state.startDate) return [];
    
    const days = [];
    const totalDays = state.sprintDuration * 7;
    const current = new Date(state.startDate);
    
    for (let i = 0; i < totalDays; i++) {
        const dayOfWeek = current.getDay();
        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            days.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
    }
    
    return days;
}

// Format date for display
function formatDate(date) {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

// Format date to string key
function dateToKey(date) {
    return date.toISOString().split('T')[0];
}

// Render availability matrix
function renderAvailabilityMatrix() {
    if (state.members.length === 0) {
        elements.availabilityMatrix.innerHTML = '<div class="empty-state">Agrega miembros del equipo para configurar disponibilidad.</div>';
        return;
    }

    const sprintDays = getSprintDays();
    
    if (sprintDays.length === 0) {
        elements.availabilityMatrix.innerHTML = '<div class="empty-state">Configura la fecha de inicio del sprint.</div>';
        return;
    }

    let html = '<table class="matrix-table"><thead><tr><th>Miembro</th>';
    
    // Header with dates
    sprintDays.forEach(day => {
        html += `<th>${formatDate(day)}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    // Rows for each member
    state.members.forEach(member => {
        html += `<tr><td>${member}</td>`;
        sprintDays.forEach(day => {
            const key = dateToKey(day);
            const isAvailable = state.availability[member][key] !== false;
            html += `<td>
                <input type="checkbox" 
                       class="availability-checkbox" 
                       ${isAvailable ? 'checked' : ''}
                       onchange="toggleAvailability('${member}', '${key}')"
                       title="${isAvailable ? 'Disponible' : 'Ausente'}">
            </td>`;
        });
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    elements.availabilityMatrix.innerHTML = html;
}

// Toggle availability
function toggleAvailability(member, dateKey) {
    state.availability[member][dateKey] = !state.availability[member][dateKey];
}

// Generate assignment
function generateAssignment() {
    if (state.members.length === 0) {
        alert('Agrega al menos un miembro del equipo.');
        return;
    }

    const sprintDays = getSprintDays();
    if (sprintDays.length === 0) {
        alert('Configura la fecha de inicio del sprint.');
        return;
    }

    const assignments = [];
    
    sprintDays.forEach(day => {
        const dateKey = dateToKey(day);
        
        // Get available members for this day
        const availableMembers = state.members.filter(member => {
            return state.availability[member][dateKey] !== false;
        });
        
        if (availableMembers.length === 0) {
            assignments.push({
                date: day,
                facilitator: '⚠️ Nadie disponible'
            });
        } else {
            // Random selection from available members
            const randomIndex = Math.floor(Math.random() * availableMembers.length);
            assignments.push({
                date: day,
                facilitator: availableMembers[randomIndex]
            });
        }
    });

    renderResults(assignments);
}

// Render results
function renderResults(assignments) {
    let html = '';
    
    assignments.forEach(assignment => {
        html += `<div class="day-assignment">`;
        html += `<strong>${formatDate(assignment.date)}</strong>: ${assignment.facilitator}`;
        html += `</div>`;
    });
    
    elements.resultsContainer.innerHTML = html;
    elements.resultsSection.style.display = 'block';
    
    // Scroll to results
    elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
    
    // Store formatted text for copying
    elements.resultsContainer.dataset.copyText = formatForTeams(assignments);
}

// Format results for Teams
function formatForTeams(assignments) {
    let text = '📅 **Asignación de Facilitadores Daily**\n\n';
    
    assignments.forEach(assignment => {
        const dateStr = formatDate(assignment.date);
        text += `**${dateStr}**: ${assignment.facilitator}\n`;
    });
    
    text += '\n---\nGenerado con Tatocao 🎯';
    
    return text;
}

// Copy to clipboard
function copyToClipboard() {
    const text = elements.resultsContainer.dataset.copyText;
    
    navigator.clipboard.writeText(text).then(() => {
        // Visual feedback
        const originalText = elements.copyBtn.textContent;
        elements.copyBtn.textContent = '✅ Copiado!';
        setTimeout(() => {
            elements.copyBtn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        alert('Error al copiar al portapapeles. Por favor, copia manualmente.');
        console.error('Copy error:', err);
    });
}

// Make functions available globally
window.removeMember = removeMember;
window.toggleAvailability = toggleAvailability;

// Initialize app
init();
