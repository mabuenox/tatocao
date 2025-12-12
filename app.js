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

    elements.membersList.innerHTML = '';
    state.members.forEach((member, index) => {
        const memberTag = document.createElement('div');
        memberTag.className = 'member-tag';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = member;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-danger';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => removeMember(member));
        
        memberTag.appendChild(nameSpan);
        memberTag.appendChild(removeBtn);
        elements.membersList.appendChild(memberTag);
    });
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

    const table = document.createElement('table');
    table.className = 'matrix-table';
    
    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const memberHeader = document.createElement('th');
    memberHeader.textContent = 'Miembro';
    headerRow.appendChild(memberHeader);
    
    sprintDays.forEach(day => {
        const th = document.createElement('th');
        th.textContent = formatDate(day);
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create body
    const tbody = document.createElement('tbody');
    
    state.members.forEach(member => {
        const row = document.createElement('tr');
        
        const memberCell = document.createElement('td');
        memberCell.textContent = member;
        row.appendChild(memberCell);
        
        sprintDays.forEach(day => {
            const key = dateToKey(day);
            // Initialize availability to true if not set
            if (state.availability[member][key] === undefined) {
                state.availability[member][key] = true;
            }
            const isAvailable = state.availability[member][key];
            
            const td = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'availability-checkbox';
            checkbox.checked = isAvailable;
            checkbox.title = isAvailable ? 'Disponible' : 'Ausente';
            checkbox.addEventListener('change', () => toggleAvailability(member, key));
            
            td.appendChild(checkbox);
            row.appendChild(td);
        });
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    
    elements.availabilityMatrix.innerHTML = '';
    elements.availabilityMatrix.appendChild(table);
}

// Toggle availability
function toggleAvailability(member, dateKey) {
    // Toggle the value (from true to false or false to true)
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
        
        // Get available members for this day (those with true availability)
        const availableMembers = state.members.filter(member => {
            return state.availability[member][dateKey] === true;
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

// Initialize app
init();
