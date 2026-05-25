let currentUser = "";

function toggleAuth(view) {
    document.getElementById('form-login').classList.add('d-none');
    document.getElementById('form-register').classList.add('d-none');
    document.getElementById('form-forgot').classList.add('d-none');
    document.getElementById(`form-${view}`).classList.remove('d-none');
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const user = document.getElementById('reg-user').value;
    const pass = document.getElementById('reg-pass').value;
    let users = JSON.parse(localStorage.getItem('sos_users')) || {};
    if(users[user]) return alert("El nombre de usuario ya existe.");
    users[user] = { name, pass };
    localStorage.setItem('sos_users', JSON.stringify(users));
    alert("¡Cuenta registrada! Inicia sesión.");
    document.getElementById('form-register').reset();
    toggleAuth('login');
}

function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    let users = JSON.parse(localStorage.getItem('sos_users')) || {};
    if(users[user] && users[user].pass === pass) {
        currentUser = user;
        iniciarApp(users[user].name);
    } else { alert("Credenciales incorrectas."); }
}

function handleForgot(e) {
    e.preventDefault();
    const user = document.getElementById('forgot-user').value;
    let users = JSON.parse(localStorage.getItem('sos_users')) || {};
    if(users[user]) { alert(`Tu contraseña guardada es: ${users[user].pass}`); toggleAuth('login'); } 
    else { alert("El usuario no existe."); }
}

function iniciarApp(nombre) {
    document.getElementById('display-user-name').innerText = nombre;
    document.getElementById('display-user-avatar').src = `https://ui-avatars.com/api/?name=${nombre}&background=2ecc71&color=fff&bold=true`;
    document.getElementById('auth-view').classList.add('d-none');
    document.getElementById('main-app-view').classList.remove('d-none');
    activeIdx = 0; viewIdx = 0;
    renderCarousel(); applyActiveState(); loadDashboardCounters();
}

function handleLogout() {
    document.getElementById('form-login').reset();
    document.getElementById('main-app-view').classList.add('d-none');
    document.getElementById('auth-view').classList.remove('d-none');
    document.body.className = 'bg-light transition-bg';
    currentUser = "";
}

function showView(viewId) {
    document.querySelectorAll('.app-section').forEach(el => el.classList.add('d-none'));
    document.getElementById(viewId).classList.remove('d-none');
    document.querySelectorAll('.nav-custom').forEach(el => el.classList.remove('active'));
    
    if(viewId === 'dashboard-view') {
        document.getElementById('nav-dashboard').classList.add('active'); applyActiveState(); 
    } else if(viewId === 'contacts-view') {
        document.getElementById('nav-contacts').classList.add('active'); document.body.className = 'bg-light transition-bg'; renderContacts();
    } else if(viewId === 'stats-view') {
        document.getElementById('nav-stats').classList.add('active'); document.body.className = 'bg-light transition-bg';
        loadDashboardCounters(); renderLogsTable();
    }
}

// ESTADOS Y CARRUSEL
const states = [
    { class: 'app-safe', preview: 'preview-safe', title: 'Todo está bien', subtitle: 'Estado actual de protección: Seguro', text: 'Seguro', icon: 'fa-shield-halved' },
    { class: 'app-warning', preview: 'preview-warning', title: 'Modo Alerta Activo', subtitle: 'Se ha enviado una alerta preventiva', text: 'Alerta', icon: 'fa-triangle-exclamation' },
    { class: 'app-danger', preview: 'preview-danger', title: 'EMERGENCIA ACTIVADA', subtitle: 'Ubicación en tiempo real compartida', text: 'Emergencia', icon: 'fa-bell' }
];

let viewIdx = 0; let activeIdx = 0;

function nextCarousel() { viewIdx = (viewIdx + 1) % states.length; renderCarousel(); }
function prevCarousel() { viewIdx = (viewIdx - 1 + states.length) % states.length; renderCarousel(); }

function renderCarousel() {
    const st = states[viewIdx];
    const btn = document.getElementById('carousel-btn');
    btn.className = `btn-main-sos pulse ${st.preview}`;
    document.getElementById('carousel-icon').className = `fa-solid ${st.icon}`;
    document.getElementById('carousel-text').innerText = st.text;
    
    document.getElementById('carousel-text').className = viewIdx === 0 ? "mt-4 fw-bold text-success" : (viewIdx === 1 ? "mt-4 fw-bold text-warning" : "mt-4 fw-bold text-danger");
}

function activateSelectedState() {
    if(activeIdx === viewIdx) return;
    activeIdx = viewIdx; applyActiveState();
    if(activeIdx === 1) { addLog("Alerta Preventiva", "Alerta Amarilla manual."); incrementCounter("warning"); } 
    else if(activeIdx === 2) { addLog("Emergencia Crítica", "¡S.O.S Rojo manual!"); incrementCounter("danger"); } 
    else if(activeIdx === 0) { addLog("Restablecimiento", "Estado Seguro manual."); }
}

function applyActiveState() {
    const st = states[activeIdx];
    if (!document.getElementById('dashboard-view').classList.contains('d-none')) {
        document.body.className = `transition-bg ${st.class}`;
    }
    document.getElementById('status-title').innerText = st.title;
    document.getElementById('status-subtitle').innerText = st.subtitle;
    document.getElementById('cancel-emergency-zone').classList.toggle('d-none', activeIdx !== 2);
}

// INTEGRACIONES: SMARTWATCH Y ALEXA
let isWatchSynced = true;
function toggleWatchSync() {
    isWatchSynced = !isWatchSynced;
    const textEl = document.getElementById('watch-status-text');
    const iconEl = document.getElementById('watch-status-icon');
    
    if(isWatchSynced) {
        textEl.innerText = "Sincronizado";
        iconEl.className = "fa-solid fa-link text-success";
    } else {
        textEl.innerText = "No sincronizado";
        iconEl.className = "fa-solid fa-link-slash text-danger";
    }
}

function openAlexaModal() { new bootstrap.Modal(document.getElementById('alexaModal')).show(); }

function simulateAlexaCommand(command) {
    bootstrap.Modal.getInstance(document.getElementById('alexaModal')).hide();
    
    if(command === 'emergencia') {
        activeIdx = 2; viewIdx = 2;
        applyActiveState(); renderCarousel();
        addLog("Emergencia Crítica", "Activación por comando de voz (Alexa).");
        incrementCounter("danger");
    } else if(command === 'alerta') {
        activeIdx = 1; viewIdx = 1;
        applyActiveState(); renderCarousel();
        addLog("Alerta Preventiva", "Activación por comando de voz (Alexa).");
        incrementCounter("warning");
    } else if(command === 'cancelar') {
        if(activeIdx === 0) return alert("El sistema ya se encuentra en estado seguro.");
        activeIdx = 0; viewIdx = 0;
        applyActiveState(); renderCarousel();
        addLog("Cancelación de Alerta", "Cancelación por voz (Alexa).");
        incrementCounter("cancel");
    }
}

// CANCELAR Y LOGS
function triggerCancelModal() { new bootstrap.Modal(document.getElementById('cancelEmergencyModal')).show(); }
function executeEmergencyCancellation() {
    const reason = document.getElementById('cancel-reason').value;
    activeIdx = 0; viewIdx = 0;
    renderCarousel(); applyActiveState();
    addLog("Cancelación de Alerta", `Motivo: ${reason}`); incrementCounter("cancel");
    bootstrap.Modal.getInstance(document.getElementById('cancelEmergencyModal')).hide();
}

function getStorageKey(suffix) { return `sos_${currentUser}_${suffix}`; }
function incrementCounter(type) {
    const key = getStorageKey(`count_${type}`);
    localStorage.setItem(key, (parseInt(localStorage.getItem(key)) || 0) + 1);
}
function loadDashboardCounters() {
    document.getElementById('stat-danger-count').innerText = localStorage.getItem(getStorageKey("count_danger")) || 0;
    document.getElementById('stat-warning-count').innerText = localStorage.getItem(getStorageKey("count_warning")) || 0;
    document.getElementById('stat-cancel-count').innerText = localStorage.getItem(getStorageKey("count_cancel")) || 0;
}
function addLog(type, details) {
    let logs = JSON.parse(localStorage.getItem(getStorageKey("logs"))) || [];
    const now = new Date();
    logs.unshift({ timestamp: `${now.toLocaleDateString()} ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, type, details });
    localStorage.setItem(getStorageKey("logs"), JSON.stringify(logs));
}
function renderLogsTable() {
    const logs = JSON.parse(localStorage.getItem(getStorageKey("logs"))) || [];
    const body = document.getElementById('logs-table-body');
    if(!logs.length) return body.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-4">Sin eventos</td></tr>`;
    
    body.innerHTML = logs.map(l => {
        let bColor = l.type.includes("Emergencia") ? "bg-danger" : (l.type.includes("Alerta") ? "bg-warning text-dark" : (l.type.includes("Cancelación") ? "bg-dark" : "bg-success"));
        return `<tr><td class="text-muted small">${l.timestamp}</td><td><span class="badge ${bColor}">${l.type}</span></td><td>${l.details}</td></tr>`;
    }).join('');
}
function clearLogs() {
    if(confirm("¿Vaciar el informe?")) {
        ['logs','count_danger','count_warning','count_cancel'].forEach(k => localStorage.removeItem(getStorageKey(k)));
        loadDashboardCounters(); renderLogsTable();
    }
}

// CONTACTOS
let myContacts = [{ id: 1, name: "Mamá", phone: "311 000 0000" }];
function renderContacts() {
    document.getElementById('contacts-list').innerHTML = myContacts.map(c => `
        <div class="col-12 col-md-6"><div class="contact-card"><div><h6 class="mb-0 fw-bold">${c.name}</h6><small class="text-muted">${c.phone}</small></div><button class="btn btn-sm btn-light text-danger shadow-sm rounded-circle" onclick="removeContact(${c.id})"><i class="fa-solid fa-trash-can"></i></button></div></div>
    `).join('');
}
function addContact() {
    const n = document.getElementById('contact-name').value, p = document.getElementById('contact-phone').value;
    if (n && p) { myContacts.push({ id: Date.now(), name: n, phone: p }); bootstrap.Modal.getInstance(document.getElementById('addContactModal')).hide(); renderContacts(); }
}
function removeContact(id) { myContacts = myContacts.filter(c => c.id !== id); renderContacts(); }