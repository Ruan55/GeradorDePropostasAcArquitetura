// Constantes para elementos do DOM
const listaItens = document.getElementById('lista-itens');
const subtotalElement = document.getElementById('subtotal');
const impostoElement = document.getElementById('imposto');
const totalGeralElement = document.getElementById('total-geral');
const btnAdicionar = document.getElementById('btn-adicionar');
const selectExportacao = document.getElementById('select-exportacao');

// Elementos de Adição de Item
const servicoInput = document.getElementById('novo-servico');
const descricaoInput = document.getElementById('nova-descricao');
const valorInput = document.getElementById('novo-valor');

// Elementos de Importação
const btnImportarCSV = document.getElementById('btn-importar-csv');
const inputFileCSV = document.getElementById('csv-file');
const datalistServicos = document.getElementById('sugestoes-servico');

// Array que armazena os dados do orçamento
let orcamento = []; // Itens atualmente na proposta
let tabelaServicos = []; // Itens importados do CSV para Datalist/Seleção

const TAXA_IMPOSTO = 0.10; // 10%

// Função para formatar um número como moeda brasileira (R$ X.XXX,XX)
function FormatarMoeda(valor){

    return `R$ ${valor.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

}

// Função principal para atualizar os totais na tela
function AtualizarTotais(){

    // Calcula o subtotal
    const subtotal = orcamento.reduce((soma, item) => soma + item.valor, 0);

    // Calcula o valor do imposto
    const imposto = subtotal * TAXA_IMPOSTO;

    // Calcula o total geral
    const totalGeral = subtotal + imposto;

    // Atualiza o texto na interface do usuário (HTML)
    subtotalElement.textContent = FormatarMoeda(subtotal);
    impostoElement.textContent = FormatarMoeda(imposto);
    totalGeralElement.textContent = FormatarMoeda(totalGeral);

}

// Função para desenhar/renderizar a lista de itens na tabela HTML
function RenderizarItens(){

    listaItens.innerHTML = '';

    orcamento.forEach((item, index) => {

        const tr = document.createElement('tr');

        // Cria e preenche as células da linha
        tr.innerHTML = `
        
            <td>${item.servico}</td>
            <td>${item.descricao}</td>
            <td style="text-align: right;">${FormatarMoeda(item.valor)}</td>
            <td><button class="remover-item" data-index="${index}">Remover</button></td>
        
        `;

        listaItens.appendChild(tr);

    });

    AtualizarTotais();

    // Adiciona o event listener de remoção a cada botão 'Remover'
    document.querySelectorAll('.remover-item').forEach(button => {

        button.addEventListener('click', RemoverItem);

    });

}

// Função para adicionar um novo item ao orçamento
function AdicionarItem(){

    const servico = servicoInput.value.trim();
    const descricao = descricaoInput.value.trim();
    
    let valorString = valorInput.value.trim();

    if(valorString.includes(',')){

        // 1. Remove os separadores de milhar (ponto)
        valorString = valorString.replace(/\./g, '');

        // 2. Substitui o separador decimal (vírgula) por ponto
        valorString = valorString.replace(',', '.');

    }

    // Converte a string corrigida para um número float
    const valorNumerico = parseFloat(valorString);

    if(servico && !isNaN(valorNumerico) && valorNumerico > 0){

        orcamento.push({

            servico: servico,
            descricao: descricao || 'N/A',
            valor: valorNumerico

        });

        // Limpa os campos do input
        servicoInput.value = '';
        descricaoInput.value = '';
        valorInput.value = '';

        RenderizarItens();

    }

    else{

        alert('Por favor,  preencha o Serviço e o Valor corretamente');

    }

}

// Função para remover um item do orçamento
function RemoverItem(event){

    const index = parseInt(event.target.dataset.index);
    orcamento.splice(index, 1);
    RenderizarItens();

}

// Função para ler e adicionar itens de um arquivo CSV
function ImportarCSV(){

    const file = inputFileCSV.files[0];

    if(!file){

        alert("Por favor, selecione um arquivo CSV");
        return;

    }

    // Cria um objeto FileReader para ler o conteúdo do arquivo
    const reader = new FileReader();

    reader.onload = function(e){

        const csvText = e.target.result;
        ProcessarDadosCSV(csvText); // Chama a função que fará a mágica

    };

    // Lê o arquivo como o texto
    reader.readAsText(file, 'UTF-8');

}

// Função para processar o texto do CSV e atualizar o orçamento
function ProcessarDadosCSV(csvText){

    // Separa as linhas. Usa regex para garantir compatibilidade com diferentes quebras de linhas
    const linhas = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');

    if(linhas.length <= 1){

        alert("O arquivo CSV não contém dados válidos ou está vazio.");
        return;

    }

    // Limpa a tabela de serviços anterior e o datalist
    tabelaServicos = [];
    datalistServicos.innerHTML = '';

    let itensProcessados = 0;

    // Itera a partir da segunda linha (índice 1)
    for(let i = 1; i < linhas.length; i++){

        // Separa as colunas por vírgula. É importante que o CSV esteja bem formatado.
        const colunas = linhas[i].split(',');

        if(colunas.length < 3) continue; // Pula linhas imcompletas

        // Remove aspas duplas, caso existam, e espaços extras
        const servico = colunas[0].replace(/"/g, '').trim();
        const descricao = colunas[1].replace(/"/g, '').trim();
        let valorString = colunas[2].replace(/"/g, '').trim();
        let valorNumerico = parseFloat(valorString);

        if(servico && !isNaN(valorNumerico) && valorNumerico > 0){

            tabelaServicos.push({

                servico: servico,
                descricao: descricao || 'N/A',
                valor: valorNumerico

            });

            // Adiciona o datalist
            const option = document.createElement('option');
            option.value = servico;
            datalistServicos.appendChild(option);

            itensProcessados++;

        }

    }

    inputFileCSV.value = ''; // Limpa o campo do arquivo
    alert(`${itensProcessados} serviços(s) carregado(s) para a Tabela de Serviços`)

}

// Lógica de autopreenchimento ao selecionar no datalist
function AutoPreencherItem(event){

    const servicoSelecionado = event.target.value.trim();

    // Procura o item correspondente na tabela de serviços importada
    const itemEncontrado = tabelaServicos.find(item => item.servico === servicoSelecionado);

    if(itemEncontrado){

        // Preenche automaticamente a Descrição e o Valor
        descricaoInput.value = itemEncontrado.descricao;
        valorInput.value = itemEncontrado.valor.toFixed(2).replace('.', ','); // Formata para o input local

    }

    else{

        // Se o usuário digitou algo que não está na lista, limpa os outros campos
        descricaoInput.value = '';
        valorInput.value = '';

    }

}

// Função auxiliar para preencher o modelo de exportação
function PreencherModeloProposta(cliente, titulo, data){

    // Preenche os campos do cabeçalho no modelo oculto
    document.getElementById('pdf-titulo').textContent = titulo;
    document.getElementById('pdf-cliente').textContent = cliente;
    document.getElementById('pdf-data').textContent = new Date(data).toLocaleDateString('pt-BR');

    // Preencha a lista de itens e calcula totais no modelo oculto
    const pdfListaItens = document.getElementById('pdf-lista-itens');
    pdfListaItens.innerHTML = '';

    let subtotalPDF = 0;

    orcamento.forEach(item => {

        subtotalPDF += item.valor;
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
        
            <td style="border: 1px solid #ccc; padding: 8px;">${item.servico}</td>
            <td style="border: 1px solid #ccc; padding: 8px;">${item.descricao}</td>
            <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${FormatarMoeda(item.valor)}</td>
        
        `;

        pdfListaItens.appendChild(tr);

    });

    const impostoPDF = subtotalPDF * TAXA_IMPOSTO;
    const totalGeralPDF = subtotalPDF + impostoPDF;

    document.getElementById('pdf-subtotal').textContent = FormatarMoeda(subtotalPDF);
    document.getElementById('pdf-imposto').textContent = FormatarMoeda(impostoPDF);
    document.getElementById('pdf-total-geral').textContent = FormatarMoeda(totalGeralPDF);

    // Retorna o objeto com os totais calculados, caso precise
    return { subtotalPDF, impostoPDF, totalGeralPDF };

}

// Função para lidar com a seleção no Select Único de Exportação
function HandleExportacao(event){

    const opcao = event.target.value;

    if(opcao === 'pdf'){

        GerarPDF();

    }

    else if(opcao === 'doc'){

        GerarDOCPorHTML();

    }

    else if(opcao === 'csv'){

        GerarCSV();

    }

    // Limpa a seleção do select após a ação para que ele possa ser clicado novamente
    event.target.value = "";

}

// Função de Geração de PDF
function GerarPDF(){

    const cliente = document.getElementById('cliente').value;
    const titulo = document.getElementById('proposta-titulo').value;
    const data = document.getElementById('data').value;

    if(!cliente || !titulo){

        alert("Por favor, preencha o Nome do Cliente e o Título da Proposta!");
        return;

    }

    PreencherModeloProposta(cliente, titulo, data);

    // Converte o HTML do modelo para PDF usando jsPDF
    const modeloProposta = document.getElementById('modelo-proposta');
    const doc = new window.jspdf.jsPDF('p', 'pt', 'a4');

    // Tornar o modelo visível antes de gerar o PDF
    modeloProposta.style.display = 'block';

    doc.html(modeloProposta, {

        callback: function (doc){

            // Esconder o modelo de novo após a geração (no callback)
            modeloProposta.style.display = 'none';

            doc.save(`Proposta_${cliente.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);

        },

        x: 10,
        y: 10,
        html2canvas: {

            scale: 0.5,

        }

    });

}

// Função de Geração de DOCX
function GerarDOCPorHTML(){

    const cliente = document.getElementById('cliente').value;
    const titulo = document.getElementById('proposta-titulo').value;
    const data = document.getElementById('data').value;

    if(!cliente || !titulo){
        alert("Por favor, preencha o Nome do Cliente e o Título da Proposta!");
        return;
    }
    
    // 1. Preenche o modelo oculto com os dados e totais
    PreencherModeloProposta(cliente, titulo, data);

    // 2. Obtém o HTML do modelo
    const modeloProposta = document.getElementById('modelo-proposta');
    modeloProposta.style.display = 'block'; // Torna visível para garantir que o outerHTML capture a formatação completa
    const content = modeloProposta.outerHTML;
    modeloProposta.style.display = 'none'; // Esconde novamente

    // 3. Cria o conteúdo completo do arquivo DOC (incluindo o header do MIME type do Word)
    const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office'
              xmlns:w='urn:schemas-microsoft-com:office:word'
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset='utf-8'>
            <title>${titulo}</title>
            <style>
                /* Adicione estilos básicos de impressão para Word aqui, se precisar */
                body { font-family: Arial, sans-serif; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ccc; padding: 8px; }
            </style>
        </head>
        <body>
            ${content}
        </body>
        </html>`;

    
    // 4. Cria um Blob (Binary Large Object) do tipo MIME do Word
    const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
    const nomeArquivo = `Proposta_${cliente.replace(/[^a-zA-Z0-9]/g, '_')}.doc`;

    // 5. Usa o FileSaver para baixar
    saveAs(blob, nomeArquivo);
    alert("Arquivo .DOC (compatível com Word) gerado com sucesso!");

}

// Função de Geração de CSV
function GerarCSV(){

    const cliente = document.getElementById('cliente').value;
    const titulo = document.getElementById('proposta-titulo').value;

    if(!cliente || !titulo || orcamento.length === 0){

        alert("Por favor,  preencha os dados do cliente, título e adicione pelo menos um item ao orçamento!");
        return;

    }

    // Define o cabeçalho do CSV
    let csvContent = "Serviço/Item,Descrição,Valor Unitário\n";

    // Adiciona os dados dos itens
    orcamento.forEach(item => {

        // Formata a linha: substitui vírgulas e aspas duplas (se existirem) para evitar problemas no CSV
        const servico = `"${item.servico.replace(/"/g, '""')}"`;
        const descricao = `"${item.descricao.replace(/"/g, '""')}"`;

        // Usa ponto como separador decimal para CSV (padrão internacional)
        const valor = item.valor.toFixed(2);

        csvContent += `${servico},${descricao},${valor}\n`;

    });

    // Usa Blob e FileSaver.js para baixar o arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const nomeArquivo = `Orçamento_Itens_${cliente.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;

    saveAs(blob, nomeArquivo);
    alert("Arquivo CSV gerado com sucesso!");

}

// 4. Configuração de Evento Listeners
document.addEventListener('DOMContentLoaded', () => {

    btnAdicionar.addEventListener('click', AdicionarItem);
    selectExportacao.addEventListener('change', HandleExportacao);

    btnImportarCSV.addEventListener('click', ImportarCSV);

    servicoInput.addEventListener('change', AutoPreencherItem);

    // Renderiza itens iniciais (se houver) ou apenas atualiza totais
    RenderizarItens();

});