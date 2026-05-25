// ==================== LÓGICA DE AUTENTICACIÓN ====================
let currentUser = "";
let memoryDB = {
    'admin': { name: 'Evaluador / Profesor', pass: '1234', completedProfile: false }
};

function getDatabase() {
    try {
        let data = JSON.parse(localStorage.getItem('sos_users'));
        if (!data) { saveDatabase(memoryDB); return memoryDB; }
        return data;
    } catch (e) { return memoryDB; }
}

function saveDatabase(data) {
    try { localStorage.setItem('sos_users', JSON.stringify(data)); } catch (e) {}
    memoryDB = data;
}

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
    
    let users = getDatabase();
    if(users[user]) return alert("El nombre de usuario ya existe. Intenta con otro.");
    
    users[user] = { name, pass, completedProfile: false };
    saveDatabase(users);
    
    alert("¡Cuenta registrada exitosamente! Inicia sesión para continuar.");
    document.getElementById('form-register').reset();
    toggleAuth('login');
}

function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    let users = getDatabase();
    
    if(users[user] && users[user].pass === pass) {
        currentUser = user;
        iniciarApp(users[user]);
    } else { 
        alert("Usuario o contraseña incorrectos."); 
    }
}

function handleForgot(e) {
    e.preventDefault();
    const user = document.getElementById('forgot-user').value;
    let users = getDatabase();
    if(users[user]) { alert(`Tu contraseña guardada es: ${users[user].pass}`); toggleAuth('login'); } 
    else { alert("El usuario no existe en esta computadora."); }
}

function iniciarApp(userData) {
    document.getElementById('display-user-name').innerText = userData.name;
    document.getElementById('display-user-avatar').src = `https://ui-avatars.com/api/?name=${userData.name}&background=2ecc71&color=fff&bold=true`;
    document.getElementById('auth-view').classList.add('d-none');
    document.getElementById('main-app-view').classList.remove('d-none');
    
    activeIdx = 0; viewIdx = 0;
    renderCarousel(); loadDashboardCounters();
    
    loadProfileData();
    if(userData.completedProfile === false) {
        showView('profile-view');
        document.getElementById('profile-alert-first').classList.remove('d-none');
        enableProfileEdit(true);
    } else {
        showView('dashboard-view');
    }
}

function handleLogout() {
    document.getElementById('form-login').reset();
    document.getElementById('main-app-view').classList.add('d-none');
    document.getElementById('auth-view').classList.remove('d-none');
    document.body.className = 'bg-light transition-bg';
    currentUser = "";
}

// ==================== GESTIÓN DE PERFIL ====================
function loadProfileData() {
    let users = getDatabase();
    let data = users[currentUser] || {};
    document.getElementById('prof-name').value = data.name || "";
    document.getElementById('prof-phone').value = data.phone || "";
    document.getElementById('prof-blood').value = data.blood || "";
    document.getElementById('prof-conditions').value = data.conditions || "";
}

function enableProfileEdit(enable) {
    const fields = ['prof-name', 'prof-phone', 'prof-blood', 'prof-conditions'];
    fields.forEach(f => document.getElementById(f).disabled = !enable);
    document.getElementById('profile-actions-zone').classList.toggle('d-none', !enable);
    document.getElementById('btn-edit-profile').classList.toggle('d-none', enable);
}

function cancelProfileEdit() {
    loadProfileData(); enableProfileEdit(false);
    document.getElementById('profile-alert-first').classList.add('d-none');
}

function handleSaveProfile(e) {
    e.preventDefault();
    let users = getDatabase();
    users[currentUser].name = document.getElementById('prof-name').value;
    users[currentUser].phone = document.getElementById('prof-phone').value;
    users[currentUser].blood = document.getElementById('prof-blood').value;
    users[currentUser].conditions = document.getElementById('prof-conditions').value;
    users[currentUser].completedProfile = true;
    
    saveDatabase(users);
    document.getElementById('display-user-name').innerText = users[currentUser].name;
    document.getElementById('profile-alert-first').classList.add('d-none');
    enableProfileEdit(false);
    alert("¡Datos de seguridad guardados correctamente!");
    showView('dashboard-view');
}

// ==================== NAVEGACIÓN Y VISTAS ====================
function showView(viewId) {
    document.querySelectorAll('.app-section').forEach(el => el.classList.add('d-none'));
    document.getElementById(viewId).classList.remove('d-none');
    document.querySelectorAll('.nav-custom').forEach(el => el.classList.remove('active'));
    
    const navMap = {
        'dashboard-view': 'nav-dashboard', 'location-view': 'nav-location', 'profile-view': 'nav-profile', 
        'contacts-view': 'nav-contacts', 'stats-view': 'nav-stats', 'settings-view': 'nav-settings'
    };
    if(navMap[viewId]) document.getElementById(navMap[viewId]).classList.add('active');
    
    if (activeIdx !== 0 && (viewId === 'active-state-view' || viewId === 'dashboard-view')) {
        document.body.className = `transition-bg ${states[activeIdx].class}`;
    } else {
        document.body.className = 'bg-light transition-bg';
    }

    if(viewId === 'contacts-view') renderContacts();
    if(viewId === 'stats-view') { loadDashboardCounters(); renderLogsTable(); }
}

// ==================== ESTADOS Y CARRUSEL ====================
const states = [
    { class: 'app-safe', preview: 'preview-safe', title: 'TODO ESTÁ BIEN', subtitle: 'Tu cuenta se encuentra bajo protección constante.', text: 'Seguro', icon: 'fa-shield-halved', color: 'text-success' },
    { class: 'app-warning', preview: 'preview-warning', title: 'MODO ALERTA ACTIVO', subtitle: 'Se ha enviado una alerta preventiva a tu red de apoyo.', text: 'Alerta', icon: 'fa-triangle-exclamation', color: 'text-warning' },
    { class: 'app-danger', preview: 'preview-danger', title: 'EMERGENCIA ACTIVADA', subtitle: 'Ubicación compartida en tiempo real y red de seguridad notificada.', text: 'Emergencia', icon: 'fa-bell', color: 'text-danger' }
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
    activeIdx = viewIdx; 
    
    if(activeIdx === 0) {
        addLog("Restablecimiento", "Estado Seguro confirmado.");
        showActiveStateScreen();
    } else if(activeIdx === 1) { 
        addLog("Alerta Preventiva", "Activación manual desde Dashboard."); incrementCounter("warning");
        showActiveStateScreen();
    } else if(activeIdx === 2) { 
        addLog("Emergencia Crítica", "S.O.S Rojo activado."); incrementCounter("danger");
        showActiveStateScreen();
    }
}

// CAMBIA DINÁMICAMENTE EL CONTENIDO INTERNO DE LA PANTALLA ACTIVA
function showActiveStateScreen() {
    const st = states[activeIdx];
    document.body.className = `transition-bg ${st.class}`;
    
    document.getElementById('active-state-icon').className = `fa-solid ${st.icon} ${st.color} pulse mb-3`;
    document.getElementById('active-state-title').innerText = st.title;
    document.getElementById('active-state-title').className = `fw-bold mb-2 ${st.color}`;
    document.getElementById('active-state-subtitle').innerText = st.subtitle;

    const contentZone = document.getElementById('active-state-dynamic-content');
    const buttonsZone = document.getElementById('active-state-buttons-zone');

    if (activeIdx === 0) {
        // AJUSTE: Si está bien, renderiza el monitoreo de salud visual inmediato
        contentZone.innerHTML = `
            <div class="card border shadow-none p-4 mb-3 rounded-4 bg-light">
                <h6 class="fw-bold text-start mb-3 text-secondary text-uppercase small"><i class="fa-solid fa-heart-pulse me-2"></i>Estado de Salud Actual</h6>
                <div class="row g-3">
                    <div class="col-6 text-start">
                        <small class="text-muted d-block">Ritmo Cardíaco</small>
                        <strong class="fs-4 text-dark">72 <span class="fs-6 text-muted fw-normal">lpm</span></strong>
                    </div>
                    <div class="col-6 text-start">
                        <small class="text-muted d-block">Oxigenación</small>
                        <strong class="fs-4 text-dark">98%</strong>
                    </div>
                    <div class="col-6 text-start">
                        <small class="text-muted d-block">Nivel de Estrés</small>
                        <strong class="fs-5 text-success fw-bold">Óptimo</strong>
                    </div>
                    <div class="col-6 text-start">
                        <small class="text-muted d-block">Batería Watch</small>
                        <strong class="fs-5 text-dark"><i class="fa-solid fa-battery-three-quarters text-success me-1"></i>85%</strong>
                    </div>
                </div>
            </div>
        `;
        buttonsZone.innerHTML = `
            <button class="btn btn-success btn-lg fw-bold rounded-pill shadow-sm" onclick="showView('dashboard-view')">
                <i class="fa-solid fa-arrow-left me-2"></i> Volver al Centro de Control
            </button>
        `;
    } else {
        // Si está en Alerta o Emergencia Crítica, renderiza el Radar y la guía de crisis
        contentZone.innerHTML = `
            <div class="card border border-2 shadow-none p-3 mb-3 rounded-4 bg-light text-start">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="fw-bold m-0 text-dark"><i class="fa-solid fa-map-location-dot text-success me-2"></i>Rastreo Satelital</h6>
                    <span class="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-1 small"><i class="fa-solid fa-circle-dot fa-fade me-1"></i> Transmitiendo</span>
                </div>
                <div class="d-flex align-items-center gap-3">
                    <div class="radar-container" style="width: 60px; height: 60px;">
                        <div class="radar-circle pulse-ring-1" style="width: 60px; height: 60px;"></div>
                        <div class="radar-circle pulse-ring-2" style="width: 60px; height: 60px;"></div>
                        <div class="radar-center" style="width: 25px; height: 25px;"><i class="fa-solid fa-location-dot text-white small"></i></div>
                    </div>
                    <div>
                        <p class="text-muted small mb-1"><i class="fa-solid fa-compass me-1"></i> 4.6097° N, 74.0817° W</p>
                        <p class="text-muted small mb-0"><i class="fa-solid fa-building me-1"></i> Universidad Libre • Bogotá</p>
                    </div>
                </div>
            </div>
        `;
        buttonsZone.innerHTML = `
            <button class="btn btn-purple btn-lg fw-bold rounded-pill shadow-sm" onclick="showView('guide-view')">
                <i class="fa-solid fa-hand-holding-heart me-2"></i> Abrir Guía de Emergencia
            </button>
            <button class="btn btn-outline-danger btn-lg fw-bold rounded-pill" onclick="triggerCancelModal()">
                <i class="fa-solid fa-ban me-2"></i> Cancelar / Falsa Alarma
            </button>
        `;
    }

    showView('active-state-view');
}

// ==================== SMARTWATCH Y CANCELACIONES ====================
let isWatchSynced = true;
function toggleWatchSync() {
    isWatchSynced = !isWatchSynced;
    const textEl = document.getElementById('watch-status-text');
    const iconEl = document.getElementById('watch-status-icon');
    if(isWatchSynced) {
        textEl.innerText = "Sincronizado"; iconEl.className = "fa-solid fa-link text-success";
    } else {
        textEl.innerText = "No sincronizado"; iconEl.className = "fa-solid fa-link-slash text-danger";
    }
}

function triggerCancelModal() { new bootstrap.Modal(document.getElementById('cancelEmergencyModal')).show(); }
function executeEmergencyCancellation() {
    const reason = document.getElementById('cancel-reason').value;
    activeIdx = 0; viewIdx = 0; renderCarousel(); 
    addLog("Cancelación", `Motivo: ${reason}`); incrementCounter("cancel");
    bootstrap.Modal.getInstance(document.getElementById('cancelEmergencyModal')).hide();
    showView('dashboard-view');
}

function getStorageKey(suffix) { return `sos_${currentUser}_${suffix}`; }
function incrementCounter(type) {
    const key = getStorageKey(`count_${type}`);
    try { localStorage.setItem(key, (parseInt(localStorage.getItem(key)) || 0) + 1); } catch(e) {}
}

function loadDashboardCounters() {
    try {
        const d = parseInt(localStorage.getItem(getStorageKey("count_danger"))) || 0;
        const w = parseInt(localStorage.getItem(getStorageKey("count_warning"))) || 0;
        const c = parseInt(localStorage.getItem(getStorageKey("count_cancel"))) || 0;
        
        document.getElementById('stat-danger-count').innerText = d;
        document.getElementById('stat-warning-count').innerText = w;
        document.getElementById('stat-cancel-count').innerText = c;
        
        const total = d + w + c;
        const pd = total ? Math.round((d/total)*100) : 0;
        const pw = total ? Math.round((w/total)*100) : 0;
        const pc = total ? Math.round((c/total)*100) : 0;
        
        document.getElementById('pct-danger').innerText = pd;
        document.getElementById('pct-warning').innerText = pw;
        document.getElementById('pct-cancel').innerText = pc;
        document.getElementById('progress-danger').style.width = `${pd}%`;
        document.getElementById('progress-warning').style.width = `${pw}%`;
        document.getElementById('progress-cancel').style.width = `${pc}%`;
    } catch(e) {}
}

function addLog(type, details) {
    try {
        let logs = JSON.parse(localStorage.getItem(getStorageKey("logs"))) || [];
        const now = new Date();
        logs.unshift({ timestamp: `${now.toLocaleDateString()} ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, type, details });
        localStorage.setItem(getStorageKey("logs"), JSON.stringify(logs));
    } catch(e) {}
}

function renderLogsTable() {
    try {
        const logs = JSON.parse(localStorage.getItem(getStorageKey("logs"))) || [];
        const body = document.getElementById('logs-table-body');
        if(!logs.length) return body.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-4">Sin eventos</td></tr>`;
        
        body.innerHTML = logs.map(l => {
            let bColor = l.type.includes("Emergencia") ? "bg-danger" : (l.type.includes("Alerta") ? "bg-warning text-dark" : (l.type.includes("Cancelación") ? "bg-dark" : "bg-success"));
            return `<tr><td class="text-muted small">${l.timestamp}</td><td><span class="badge ${bColor}">${l.type}</span></td><td>${l.details}</td></tr>`;
        }).join('');
    } catch(e) {}
}

function clearLogs() {
    if(confirm("¿Vaciar el informe?")) {
        try { ['logs','count_danger','count_warning','count_cancel'].forEach(k => localStorage.removeItem(getStorageKey(k))); } catch(e) {}
        loadDashboardCounters(); renderLogsTable();
    }
}

// ==================== CONTACTOS ====================
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