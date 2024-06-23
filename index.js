const PromptSync = require("prompt-sync");
const prompt = PromptSync();

//Variáveis de teste
// let x0 = 123456;
// let a = 1103515245;
// let c = 12345;
// let m = 2147483648;

// let tempo_medio_chegada = 1;
// let tempo_medio_atendimento = 0.5;
// let tempo_simulacao = 480;
//

//Prompt de variáveis
let x0 = Number(prompt("Insira o valor de x0: "));
let a = Number(prompt("Insira o valor de a: "));
let c = Number(prompt("Insira o valor de c: "));
let m = Number(prompt("Insira o valor de m: "));

let tempo_medio_chegada = Number(prompt("Insira o tempo médio entre chegadas (exponencial): "));
let tempo_medio_atendimento = Number(prompt("Insira o tempo médio entre atendimentos (exponencial): "));
let tempo_simulacao = Number(prompt("Insira o tempo de simulação (minutos): "));
//

//Variáveis gerais
let status_servidor = 0;
let numero_em_fila = 0;
let fila_chegada = [];
let tempo_ultimo_evento = 0;
let relogio_simulacao = 0;
let proxima_saida = 9999999999;
let fim_simulacao = false;
let proximo_evento = "C";
let tempo_total_fila = 0;
let area_sob_qt = 0;
let area_sob_ut = 0;
let clientes_atendidos = 0;
let proxima_chegada = gerarChegada();

function aguardar(segundos) {
    return new Promise((resolve) => setTimeout(resolve, segundos));
}





//Exibe todos os estados em tempo real.
function exibirEstados() {
    let proximaSaida = proxima_saida !== 9999999999 ? proxima_saida.toFixed(2) : proxima_saida;

    console.clear();
    console.log(`
=========================
|   ESTADOS DO SISTEMA  |
-------------------------
| Status do servidor:     ${status_servidor}
| Nº em fila:             ${numero_em_fila}
| Fila de chegada:        [ ${fila_chegada.join(", ")} ]
| Tempo do último evento: ${tempo_ultimo_evento.toFixed(2)}
| Relógio da simulação:   ${relogio_simulacao.toFixed(2)}
| Próxima chegada:        ${proxima_chegada.toFixed(2)}
| Próxima saída:          ${proximaSaida}
| Fim da simulação:       ${fim_simulacao}
| Próximo evento:         ${proximo_evento}
| Tempo total da fila:    ${tempo_total_fila.toFixed(2)}
| Área sob Q﹙t﹚:         ${area_sob_qt.toFixed(2)}
| Área sob U﹙t﹚:         ${area_sob_ut.toFixed(2)}
| Clientes atendidos:     ${clientes_atendidos}
=========================
  `);
}

//Evento de chegada.
function gerarChegada() {
    let semente = (x0 * a + c) % m;
    let npa = semente / (m - 1);
    let numeroAleatorio = Math.abs(Math.log(npa) * tempo_medio_chegada);

    x0 = semente;

    return numeroAleatorio;
}

function processarChegada(chegada) {
    relogio_simulacao = chegada;

    proxima_chegada = relogio_simulacao + gerarChegada();

    if (status_servidor === 0) {
        status_servidor = 1;
        proxima_saida = relogio_simulacao + gerarSaida();
    } else {
        calcularAreaQt();
        calcularAreaUt();

        fila_chegada.push(chegada);
        numero_em_fila++;
    }

    tempo_ultimo_evento = relogio_simulacao;
}

//Evento de saída.
function gerarSaida() {
    let semente = (x0 * a + c) % m;
    let npa = semente / (m - 1);
    let numeroAleatorio = Math.abs(Math.log(npa) * tempo_medio_atendimento);

    x0 = semente;

    return numeroAleatorio;
}

function processarSaida(saida) {
    relogio_simulacao = saida;

    if (numero_em_fila > 0) {
        proxima_saida = relogio_simulacao + gerarSaida();

        calcularAreaQt();
        removerDaFila();

        tempo_total_fila += relogio_simulacao;
    } else {
        calcularAreaUt();
        proxima_saida = 9999999999;
        status_servidor = 0;
    }

    tempo_ultimo_evento = relogio_simulacao;
    clientes_atendidos++;
}

//Remoção da fila
function removerDaFila() {
    fila_chegada.shift();
    numero_em_fila = fila_chegada.length;
}

//Calculos de área
function calcularAreaQt() {
    area_sob_qt += (relogio_simulacao - tempo_ultimo_evento) * numero_em_fila;
}

function calcularAreaUt() {
    area_sob_ut += (relogio_simulacao - tempo_ultimo_evento) * status_servidor;
}

//Alterna entre os eventos de chegada (C) e de saída (S).
function alternarEvento() {
    let proximaSaida = proxima_saida !== 9999999999 ? proxima_saida.toFixed(2) : proxima_saida;

    console.log("\nTemporizador:");
    console.log(`Próxima chegada: ${proxima_chegada.toFixed(2)}`);
    console.log(`Próxima saída: ${proximaSaida}`);

    if (proxima_chegada <= proxima_saida) return "C";

    return "S";
}

//Função de inicialização do programa.
async function iniciarSimulacao() {
    let indice = 0;
    let avancarGeracoes = false;
    let continuarExibindo = "";

    while (true) {
        exibirEstados();

        console.log(`Geração atual: ${indice + 1}`);
        console.log("\nVocê deseja continuar exibindo os dados (s/n)?\n");

        if (!avancarGeracoes) {
            continuarExibindo = prompt("Resposta: ");
        }

        if (continuarExibindo === "n" || continuarExibindo === "N") {
            avancarGeracoes = true;
        }

        if (proximo_evento === "C") processarChegada(proxima_chegada);
        if (proximo_evento === "S") processarSaida(proxima_saida);

        if (proxima_chegada > tempo_simulacao && proxima_saida === 9999999999) {
            let tempoMedioEmFila = tempo_total_fila / clientes_atendidos;
            let numeroMedioEmFila = area_sob_qt / tempo_simulacao;
            let taxaDeOcupacao = (area_sob_ut / relogio_simulacao) * 100;

            fim_simulacao = true;
            relogio_simulacao = tempo_simulacao;

            exibirEstados();

            console.log(`Total de gerações: ${indice}\n`);

            console.log(`Tempo médio em fila: ${tempoMedioEmFila.toFixed(2)}`);
            console.log(`Número médio em fila: ${numeroMedioEmFila.toFixed(2)}`);
            console.log(`Taxa de ocupação: ${taxaDeOcupacao.toFixed(2)}%\\n`);

            break;
          } else if (proxima_chegada > tempo_simulacao) {
            proximo_evento = "S";
          } else {
            proximo_evento = alternarEvento();
      
            if (!avancarGeracoes) await aguardar(2000);
          }
      
          indice++;
        }
      }
      
      iniciarSimulacao();