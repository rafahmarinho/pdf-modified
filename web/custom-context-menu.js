/**
 * Implementação personalizada do menu de contexto para copiar texto para a barra de busca
 */

class CustomContextMenu {
  constructor(container, eventBus, findBar) {
    this.container = container;
    this.eventBus = eventBus;
    this.findBar = findBar;
    
    // Referência à barra e ao campo de pesquisa
    this.findBarElement = this.findBar.bar;
    this.findFieldElement = this.findBar.findField;
    
    // Cria o menu de contexto personalizado
    this.contextMenu = document.createElement('div');
    this.contextMenu.className = 'customContextMenu';
    this.contextMenu.style.display = 'none';
    this.contextMenu.style.position = 'absolute';
    this.contextMenu.style.zIndex = '1000';
    this.contextMenu.style.background = 'white';
    this.contextMenu.style.border = '1px solid #ccc';
    this.contextMenu.style.borderRadius = '4px';
    this.contextMenu.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    this.contextMenu.style.padding = '5px 0';
    document.body.appendChild(this.contextMenu);
    
    // Opção "Copiar para Busca"
    const copyToSearchOption = document.createElement('div');
    copyToSearchOption.textContent = 'Copiar para Busca';
    copyToSearchOption.style.padding = '8px 12px';
    copyToSearchOption.style.cursor = 'pointer';
    copyToSearchOption.style.userSelect = 'none';
    copyToSearchOption.style.color = '#000';
    
    copyToSearchOption.addEventListener('mouseover', () => {
      copyToSearchOption.style.backgroundColor = '#f2f2f2';
    });
    
    copyToSearchOption.addEventListener('mouseout', () => {
      copyToSearchOption.style.backgroundColor = 'transparent';
    });
    
    copyToSearchOption.addEventListener('click', this.copyTextToSearch.bind(this));
    this.contextMenu.appendChild(copyToSearchOption);
    
    // Adiciona o evento de contextmenu ao container
    this.container.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    
    // Fecha o menu ao clicar em qualquer lugar
    document.addEventListener('click', this.hideContextMenu.bind(this));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideContextMenu();
      }
    });
  }
  
  handleContextMenu(event) {
    const selection = document.getSelection();
    const selectedText = selection.toString().trim();
    
    // Apenas mostra o menu se houver texto selecionado
    if (selectedText) {
      event.preventDefault();
      this.showContextMenu(event.clientX, event.clientY);
      
      // Armazena o texto selecionado para uso posterior
      this.selectedText = selectedText;
    } else {
      this.hideContextMenu();
    }
  }
  
  showContextMenu(x, y) {
    // Posiciona o menu no local do clique
    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;
    this.contextMenu.style.display = 'block';
  }
  
  hideContextMenu() {
    this.contextMenu.style.display = 'none';
  }
  
  copyTextToSearch() {
    if (this.selectedText) {
      // Coloca o texto na barra de busca
      this.findFieldElement.value = this.selectedText;
      
      // Fecha o menu
      this.hideContextMenu();
      
      // Dispara o evento para iniciar a busca
      this.findFieldElement.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Mostra a barra de busca se estiver oculta
      if (this.findBarElement.classList.contains('hidden')) {
        this.eventBus.dispatch('find', { source: this, type: 'find' });
      }
      
      // Dá foco à barra de busca
      this.findFieldElement.focus();
      
      // Copia para a área de transferência
      navigator.clipboard.writeText(this.selectedText).catch(error => {
        console.warn('Não foi possível copiar para a área de transferência: ', error);
      });
    }
  }
}

// Exporta a classe para uso em outros módulos
export { CustomContextMenu };
