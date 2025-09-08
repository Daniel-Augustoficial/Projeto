// Classe para gerenciar as tarefas
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentEditId = null;
        this.initializeEventListeners();
        this.renderTasks();
        this.updateStats();
    }

    // Carregar tarefas do localStorage
    loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        return savedTasks ? JSON.parse(savedTasks) : [];
    }

    // Salvar tarefas no localStorage
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    // Gerar ID único para nova tarefa
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Inicializar event listeners
    initializeEventListeners() {
        // Formulário de tarefa
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Botão cancelar
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.cancelEdit();
        });

        // Filtros e busca
        document.getElementById('searchInput').addEventListener('input', () => {
            this.renderTasks();
        });

        document.getElementById('statusFilter').addEventListener('change', () => {
            this.renderTasks();
        });

        document.getElementById('priorityFilter').addEventListener('change', () => {
            this.renderTasks();
        });

        // Modal de confirmação
        document.getElementById('confirmDelete').addEventListener('click', () => {
            this.confirmDelete();
        });

        document.getElementById('cancelDelete').addEventListener('click', () => {
            this.hideDeleteModal();
        });

        // Fechar modal clicando fora
        document.getElementById('deleteModal').addEventListener('click', (e) => {
            if (e.target.id === 'deleteModal') {
                this.hideDeleteModal();
            }
        });

        // Tecla ESC para fechar modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideDeleteModal();
                this.cancelEdit();
            }
        });
    }

    // Manipular submissão do formulário
    handleFormSubmit() {
        const formData = this.getFormData();
        
        if (!formData.title.trim()) {
            this.showNotification('Por favor, insira um título para a tarefa.', 'error');
            return;
        }

        if (this.currentEditId) {
            this.updateTask(this.currentEditId, formData);
            this.showNotification('Tarefa atualizada com sucesso!', 'success');
        } else {
            this.addTask(formData);
            this.showNotification('Tarefa adicionada com sucesso!', 'success');
        }

        this.resetForm();
        this.renderTasks();
        this.updateStats();
    }

    // Obter dados do formulário
    getFormData() {
        return {
            title: document.getElementById('taskTitle').value.trim(),
            description: document.getElementById('taskDescription').value.trim(),
            date: document.getElementById('taskDate').value,
            priority: document.getElementById('taskPriority').value,
            completed: false,
            createdAt: new Date().toISOString()
        };
    }

    // Adicionar nova tarefa
    addTask(taskData) {
        const task = {
            id: this.generateId(),
            ...taskData
        };
        this.tasks.unshift(task);
        this.saveTasks();
    }

    // Atualizar tarefa existente
    updateTask(id, taskData) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = {
                ...this.tasks[taskIndex],
                ...taskData,
                updatedAt: new Date().toISOString()
            };
            this.saveTasks();
        }
    }

    // Excluir tarefa
    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.showNotification('Tarefa excluída com sucesso!', 'success');
    }

    // Alternar status de conclusão da tarefa
    toggleTaskCompletion(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            
            const message = task.completed ? 'Tarefa marcada como concluída!' : 'Tarefa marcada como pendente!';
            this.showNotification(message, 'success');
        }
    }

    // Editar tarefa
    editTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            this.currentEditId = id;
            this.populateForm(task);
            this.showEditMode();
            document.getElementById('taskTitle').focus();
        }
    }

    // Popular formulário com dados da tarefa
    populateForm(task) {
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskDate').value = task.date || '';
        document.getElementById('taskPriority').value = task.priority;
    }

    // Mostrar modo de edição
    showEditMode() {
        document.getElementById('submitBtnText').textContent = 'Atualizar Tarefa';
        document.getElementById('cancelBtn').style.display = 'inline-flex';
        document.querySelector('.task-form-section h2').textContent = 'Editar Tarefa';
        
        // Scroll para o formulário
        document.querySelector('.task-form-section').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    // Cancelar edição
    cancelEdit() {
        this.currentEditId = null;
        this.resetForm();
        document.getElementById('submitBtnText').textContent = 'Adicionar Tarefa';
        document.getElementById('cancelBtn').style.display = 'none';
        document.querySelector('.task-form-section h2').textContent = 'Adicionar Nova Tarefa';
    }

    // Resetar formulário
    resetForm() {
        document.getElementById('taskForm').reset();
        document.getElementById('taskPriority').value = 'media';
    }

    // Filtrar tarefas
    getFilteredTasks() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const priorityFilter = document.getElementById('priorityFilter').value;

        return this.tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchTerm) ||
                                task.description.toLowerCase().includes(searchTerm);
            
            const matchesStatus = statusFilter === 'todas' ||
                                (statusFilter === 'pendentes' && !task.completed) ||
                                (statusFilter === 'concluidas' && task.completed);
            
            const matchesPriority = priorityFilter === 'todas' ||
                                  task.priority === priorityFilter;

            return matchesSearch && matchesStatus && matchesPriority;
        });
    }

    // Renderizar tarefas
    renderTasks() {
        const tasksList = document.getElementById('tasksList');
        const emptyState = document.getElementById('emptyState');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            tasksList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        tasksList.style.display = 'block';
        emptyState.style.display = 'none';

        tasksList.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');

        // Adicionar event listeners para os botões das tarefas
        this.attachTaskEventListeners();
    }

    // Criar HTML para uma tarefa
    createTaskHTML(task) {
        const formattedDate = task.date ? this.formatDate(task.date) : '';
        const priorityClass = `priority-${task.priority}`;
        const completedClass = task.completed ? 'completed' : '';

        return `
            <div class="task-item ${completedClass}" data-id="${task.id}">
                <div class="task-header">
                    <div class="task-info">
                        <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                                   onchange="taskManager.toggleTaskCompletion('${task.id}')">
                            <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
                        </div>
                        ${task.description ? `<p class="task-description">${this.escapeHtml(task.description)}</p>` : ''}
                        <div class="task-meta">
                            ${formattedDate ? `<span class="task-date">📅 ${formattedDate}</span>` : ''}
                            <span class="task-priority">
                                <span class="priority-badge ${priorityClass}">
                                    ${this.getPriorityIcon(task.priority)} ${task.priority}
                                </span>
                            </span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-small btn-secondary" onclick="taskManager.editTask('${task.id}')" 
                                title="Editar tarefa">
                            ✏️ Editar
                        </button>
                        <button class="btn btn-small btn-danger" onclick="taskManager.showDeleteModal('${task.id}')" 
                                title="Excluir tarefa">
                            🗑️ Excluir
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Anexar event listeners para tarefas
    attachTaskEventListeners() {
        // Os event listeners são anexados via onclick nos botões
        // Isso é feito para simplicidade, mas poderia ser melhorado usando addEventListener
    }

    // Mostrar modal de confirmação de exclusão
    showDeleteModal(id) {
        this.taskToDelete = id;
        document.getElementById('deleteModal').classList.add('show');
    }

    // Esconder modal de confirmação de exclusão
    hideDeleteModal() {
        document.getElementById('deleteModal').classList.remove('show');
        this.taskToDelete = null;
    }

    // Confirmar exclusão
    confirmDelete() {
        if (this.taskToDelete) {
            this.deleteTask(this.taskToDelete);
            this.hideDeleteModal();
        }
    }

    // Atualizar estatísticas
    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;

        document.getElementById('totalTasks').textContent = 
            `${totalTasks} ${totalTasks === 1 ? 'tarefa' : 'tarefas'}`;
        document.getElementById('completedTasks').textContent = 
            `${completedTasks} ${completedTasks === 1 ? 'concluída' : 'concluídas'}`;
    }

    // Utilitários
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    getPriorityIcon(priority) {
        const icons = {
            'alta': '🔴',
            'media': '🟡',
            'baixa': '🟢'
        };
        return icons[priority] || '⚪';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Mostrar notificação
    showNotification(message, type = 'info') {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Estilos da notificação
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            color: white;
            font-weight: 500;
            z-index: 1001;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;

        // Cores baseadas no tipo
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Adicionar ao DOM
        document.body.appendChild(notification);

        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Adicionar estilos para as animações das notificações
const notificationStyles = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;

// Adicionar estilos ao head
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Inicializar o gerenciador de tarefas quando o DOM estiver carregado
let taskManager;

document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
    
    // Definir data mínima como hoje
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('taskDate').setAttribute('min', today);
});

// Funções globais para compatibilidade com onclick
window.taskManager = null;

// Garantir que as funções estejam disponíveis globalmente
window.addEventListener('load', () => {
    if (taskManager) {
        window.taskManager = taskManager;
    }
});

// Adicionar funcionalidade de atalhos de teclado
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter para submeter formulário
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const form = document.getElementById('taskForm');
        if (document.activeElement && form.contains(document.activeElement)) {
            e.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    }
    
    // Ctrl/Cmd + K para focar na busca
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
});

// Adicionar funcionalidade de arrastar e soltar (drag and drop) para reordenar tarefas
let draggedElement = null;

document.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('task-item')) {
        draggedElement = e.target;
        e.target.style.opacity = '0.5';
    }
});

document.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('task-item')) {
        e.target.style.opacity = '';
        draggedElement = null;
    }
});

document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
    if (draggedElement && e.target.classList.contains('task-item') && e.target !== draggedElement) {
        const draggedId = draggedElement.dataset.id;
        const targetId = e.target.dataset.id;
        
        if (taskManager && draggedId && targetId) {
            taskManager.reorderTasks(draggedId, targetId);
        }
    }
});

// Adicionar método de reordenação ao TaskManager
if (typeof TaskManager !== 'undefined') {
    TaskManager.prototype.reorderTasks = function(draggedId, targetId) {
        const draggedIndex = this.tasks.findIndex(task => task.id === draggedId);
        const targetIndex = this.tasks.findIndex(task => task.id === targetId);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
            const draggedTask = this.tasks.splice(draggedIndex, 1)[0];
            this.tasks.splice(targetIndex, 0, draggedTask);
            this.saveTasks();
            this.renderTasks();
            this.showNotification('Tarefas reordenadas!', 'success');
        }
    };
}

