/**
 * SocialLife App - JavaScript Logic
 * Author: Senior Frontend Developer
 * Features: Plans, Expenses, Events, Dashboard, LocalStorage, Toasts
 */

const app = {
    // --- State ---
    state: {
        plans: [],
        events: [],
        currentView: 'dashboard',
        activePlanId: null
    },

    // --- Initialization ---
    init() {
        this.loadData();
        this.bindEvents();
        this.render();
        this.checkInitialData();
        console.log('SocialLife App Initialized');
    },

    loadData() {
        const savedPlans = localStorage.getItem('sl_plans');
        const savedEvents = localStorage.getItem('sl_events');
        
        if (savedPlans) this.state.plans = JSON.parse(savedPlans);
        if (savedEvents) this.state.events = JSON.parse(savedEvents);
    },

    saveData() {
        localStorage.setItem('sl_plans', JSON.stringify(this.state.plans));
        localStorage.setItem('sl_events', JSON.stringify(this.state.events));
    },

    checkInitialData() {
        // Precargar datos de ejemplo si está vacío
        if (this.state.plans.length === 0) {
            const demoPlan = {
                id: Date.now(),
                name: 'Cena de Verano 🍕',
                date: '2026-07-15',
                location: 'Terraza del Puerto',
                participants: 'Ana, Luis, Marta',
                budget: 150,
                expenses: [
                    { id: 1, name: 'Reserva', amount: 30 },
                    { id: 2, name: 'Bebidas', amount: 45 }
                ]
            };
            this.state.plans.push(demoPlan);
            
            const demoEvent = {
                id: Date.now() + 1,
                title: 'Comprar entradas concierto 🎫',
                date: new Date().toISOString().split('T')[0],
                completed: false
            };
            this.state.events.push(demoEvent);
            
            this.saveData();
            this.render();
        }
    },

    // --- Navigation & UI ---
    navigateTo(viewId, params = {}) {
        this.state.currentView = viewId;
        
        // Update Active Nav Item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.id === `nav-${viewId}`) item.classList.add('active');
        });

        // Update View Visibility
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        
        const targetView = document.getElementById(`view-${viewId}`);
        if (targetView) targetView.classList.add('active');

        // Handle specific view logic
        if (viewId === 'plan-detail' && params.id) {
            this.state.activePlanId = params.id;
            this.renderPlanDetail(params.id);
        }

        // Update Header Title
        const titleMap = {
            'dashboard': 'Dashboard',
            'planes': 'Mis Planes',
            'eventos': 'Calendario',
            'plan-detail': 'Detalles'
        };
        document.getElementById('page-title').innerText = titleMap[viewId] || 'SocialLife';
        
        window.scrollTo(0, 0);
    },

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        // Reset forms if needed
        const form = document.querySelector(`#${modalId} form`);
        if (form) form.reset();
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerText = message;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // --- Core Logic: Plans ---
    addPlan(planData) {
        const newPlan = {
            id: Date.now(),
            ...planData,
            expenses: []
        };
        this.state.plans.push(newPlan);
        this.saveData();
        this.render();
        this.showToast('Plan creado con éxito! 🎉');
    },

    deletePlan(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este plan?')) {
            this.state.plans = this.state.plans.filter(p => p.id !== id);
            this.saveData();
            this.navigateTo('planes');
            this.render();
            this.showToast('Plan eliminado');
        }
    },

    addExpense(planId, expenseData) {
        const plan = this.state.plans.find(p => p.id === planId);
        if (plan) {
            const newExpense = {
                id: Date.now(),
                ...expenseData
            };
            plan.expenses.push(newExpense);
            this.saveData();
            this.renderPlanDetail(planId);
            this.render(); // Update dashboard
            this.showToast('Gasto añadido 💸');
        }
    },

    // --- Core Logic: Events ---
    addEvent(eventData) {
        const newEvent = {
            id: Date.now(),
            ...eventData,
            completed: false
        };
        this.state.events.push(newEvent);
        this.saveData();
        this.render();
        this.showToast('Evento agendado 🔔');
    },

    toggleEvent(id) {
        const event = this.state.events.find(e => e.id === id);
        if (event) {
            event.completed = !event.completed;
            this.saveData();
            this.render();
        }
    },

    // --- Rendering ---
    render() {
        this.renderDashboard();
        this.renderPlanes();
        this.renderEventos();
    },

    renderDashboard() {
        // Summary
        let totalBudget = 0;
        let totalSpent = 0;
        
        this.state.plans.forEach(p => {
            totalBudget += parseFloat(p.budget);
            p.expenses.forEach(e => totalSpent += parseFloat(e.amount));
        });

        document.getElementById('dash-total-budget').innerText = `€${totalBudget.toFixed(2)}`;
        document.getElementById('dash-total-spent').innerText = `€${totalSpent.toFixed(2)}`;

        // Next Plans (Horizontal Scroll)
        const nextPlansList = document.getElementById('next-plans-list');
        const upcomingPlans = [...this.state.plans]
            .filter(p => new Date(p.date) >= new Date().setHours(0,0,0,0))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5);

        if (upcomingPlans.length === 0) {
            nextPlansList.innerHTML = '<p class="empty-msg">No hay planes próximos. ¡Crea uno!</p>';
        } else {
            nextPlansList.innerHTML = upcomingPlans.map(p => `
                <div class="plan-mini-card" onclick="app.navigateTo('plan-detail', {id: ${p.id}})">
                    <span class="info-label">${this.formatDate(p.date)}</span>
                    <h4>${p.name}</h4>
                    <p class="info-value">€${p.budget}</p>
                </div>
            `).join('');
        }

        // Today Events
        const todayStr = new Date().toISOString().split('T')[0];
        const todayEvents = this.state.events.filter(e => e.date === todayStr);
        const todayList = document.getElementById('today-events-list');

        if (todayEvents.length === 0) {
            todayList.innerHTML = '<p class="empty-msg">No tienes eventos para hoy.</p>';
        } else {
            todayList.innerHTML = todayEvents.map(e => `
                <div class="card event-item ${e.completed ? 'completed' : ''}" onclick="app.toggleEvent(${e.id})">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span class="check-icon">${e.completed ? '✅' : '⭕'}</span>
                        <span style="${e.completed ? 'text-decoration: line-through; color: var(--text-secondary);' : ''}">${e.title}</span>
                    </div>
                </div>
            `).join('');
        }
    },

    renderPlanes() {
        const container = document.getElementById('plans-list');
        if (this.state.plans.length === 0) {
            container.innerHTML = '<p class="empty-msg">Aún no has creado ningún plan.</p>';
            return;
        }

        container.innerHTML = this.state.plans.map(p => {
            const spent = p.expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
            const percent = Math.min((spent / p.budget) * 100, 100);
            
            // LED Logic
            let ledClass = 'led-green';
            let glowClass = 'glow-green';
            if (spent > p.budget) {
                ledClass = 'led-red';
                glowClass = 'glow-red';
            } else if (spent > p.budget * 0.8) {
                ledClass = 'led-yellow';
                glowClass = 'glow-yellow';
            }

            return `
                <div class="card ${glowClass}" onclick="app.navigateTo('plan-detail', {id: ${p.id}})">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <span class="info-label">${this.formatDate(p.date)}</span>
                            <h3 style="margin: 4px 0;">${p.name}</h3>
                            <span class="info-label">📍 ${p.location || 'Sin lugar'}</span>
                        </div>
                        <div class="led-indicator ${ledClass}"></div>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${percent}%; background-color: ${spent > p.budget ? 'var(--accent-red)' : 'var(--accent-green)'}"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px;">
                        <span>Gasto: €${spent.toFixed(2)}</span>
                        <span>Presupuesto: €${p.budget}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderEventos() {
        const container = document.getElementById('events-calendar-list');
        const sortedEvents = [...this.state.events].sort((a, b) => new Date(a.date) - new Date(b.date));

        if (sortedEvents.length === 0) {
            container.innerHTML = '<p class="empty-msg">No hay eventos programados.</p>';
            return;
        }

        container.innerHTML = sortedEvents.map(e => `
            <div class="card event-item ${e.completed ? 'completed' : ''}" onclick="app.toggleEvent(${e.id})">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span class="check-icon">${e.completed ? '✅' : '⭕'}</span>
                        <div>
                            <p style="${e.completed ? 'text-decoration: line-through; color: var(--text-secondary);' : 'font-weight: 500;'}">${e.title}</p>
                            <span class="info-label">${this.formatDate(e.date)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    renderPlanDetail(id) {
        const plan = this.state.plans.find(p => p.id === id);
        const container = document.getElementById('plan-detail-content');
        if (!plan) return;

        const spent = plan.expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const remaining = plan.budget - spent;

        container.innerHTML = `
            <div class="plan-detail-header">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h2>${plan.name}</h2>
                    <button class="btn-text" style="color: var(--accent-red)" onclick="app.deletePlan(${plan.id})">Eliminar</button>
                </div>
                <p class="info-label">${this.formatDate(plan.date)} • ${plan.location}</p>
            </div>

            <div class="plan-info-grid">
                <div class="info-item">
                    <span class="info-label">Presupuesto</span>
                    <span class="info-value">€${plan.budget}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Gastado</span>
                    <span class="info-value" style="color: ${spent > plan.budget ? 'var(--accent-red)' : 'inherit'}">€${spent.toFixed(2)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Restante</span>
                    <span class="info-value">€${remaining.toFixed(2)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Participantes</span>
                    <span class="info-value">${plan.participants || 'Solo tú'}</span>
                </div>
            </div>

            <div class="section-header">
                <h3>Gastos</h3>
                <button class="btn-primary" onclick="app.showExpenseModal(${plan.id})">+ Añadir</button>
            </div>
            
            <div class="expenses-list card">
                ${plan.expenses.length === 0 ? '<p class="info-label">No hay gastos registrados.</p>' : 
                  plan.expenses.map(e => `
                    <div class="expense-item">
                        <div class="expense-info">
                            <h4>${e.name}</h4>
                        </div>
                        <div class="expense-amount">€${parseFloat(e.amount).toFixed(2)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    showExpenseModal(planId) {
        document.getElementById('expense-plan-id').value = planId;
        this.showModal('modal-expense');
    },

    // --- Helpers ---
    formatDate(dateStr) {
        const options = { weekday: 'short', day: 'numeric', month: 'short' };
        return new Date(dateStr).toLocaleDateString('es-ES', options);
    },

    // --- Event Listeners ---
    bindEvents() {
        // Form Plan
        document.getElementById('form-plan').addEventListener('submit', (e) => {
            e.preventDefault();
            const planData = {
                name: document.getElementById('plan-name').value,
                date: document.getElementById('plan-date').value,
                budget: parseFloat(document.getElementById('plan-budget').value),
                location: document.getElementById('plan-location').value,
                participants: document.getElementById('plan-participants').value
            };
            this.addPlan(planData);
            this.closeModal('modal-plan');
        });

        // Form Expense
        document.getElementById('form-expense').addEventListener('submit', (e) => {
            e.preventDefault();
            const planId = parseInt(document.getElementById('expense-plan-id').value);
            const expenseData = {
                name: document.getElementById('expense-name').value,
                amount: parseFloat(document.getElementById('expense-amount').value)
            };
            this.addExpense(planId, expenseData);
            this.closeModal('modal-expense');
        });

        // Form Evento
        document.getElementById('form-evento').addEventListener('submit', (e) => {
            e.preventDefault();
            const eventData = {
                title: document.getElementById('event-title').value,
                date: document.getElementById('event-date').value
            };
            this.addEvent(eventData);
            this.closeModal('modal-evento');
        });

        // Filter chips (Visual only for now)
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                // Filter logic could be added here
            });
        });
    }
};

// Start App
document.addEventListener('DOMContentLoaded', () => app.init());
