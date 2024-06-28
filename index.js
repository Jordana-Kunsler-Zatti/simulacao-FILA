const prompt = require('prompt-sync')();

let x0 = 123456789;
let a = 1664525;
let c = 1013904223;
let m = 2147483648;

console.log('Você quer digitar os parametros para a geração dos NPAs?(S/N)\n');

let isNotValid = prompt('Resposta: ').toUpperCase() === 'S';

// function for validate NPA parameters
const validSeed = () => {
  const observedFrequency = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const expectedFrequency = 250;

  let xBefore = x0;

  for (let index = 0; index < 5000; index++) {
    xBefore = (a * xBefore + c) % m;
    let normalizedValue = xBefore / (m - 1);
    let numberPosition = parseInt(normalizedValue / 0.05);
    observedFrequency[numberPosition] += 1;
  }

  let quiquadr_calc = 0;
  const quiquadr_tab = 30.14;
  for (let index = 0; index < 20; index++) {
    quiquadr_calc += (observedFrequency[index] - expectedFrequency) ** 2 / expectedFrequency;
  }

  if (quiquadr_calc <= quiquadr_tab) {
    isNotValid = false;
  } else {
    console.log('Essa sequência gera NPAs inválidos, digite novamente!');
  }
};

// variables prompt
while (isNotValid) {
  console.log('\nDigite os paramentros para gerar NPAs');
  x0 = Number(prompt('Valor de x0: '));
  a = Number(prompt('Valor de a: '));
  c = Number(prompt('Valor de c: '));
  m = Number(prompt('Valor de m: '));

  validSeed();
}

console.log('\nDigite as variaveis para a simulação');
let timeMediumArrival = Number(prompt('Tempo medio entre chegadas: '));
let timeMediumAttendance = Number(prompt('Tempo medio entre atendimentos: '));
let timeSimulation = Number(prompt('Tempo em minutos para simulacao: '));

// variables simulation
let statusServer = 0;
let queueSize = 0;
let queueArrival = [];
let timeLastEvent = 0;
let simulationClock = 0;
let nextOutput = 9999999999;
let simulationEnd = false;
let nextEvent = 'input';
let timeTotalQueue = 0;
let areaSobQt = 0;
let areaSobBt = 0;
let clientAttended = 0;
let nextArrival = getNextEvent('input');
let currentClient = 0;

// show simulation data
const showStates = () => {
  // console.clear();

  return console.log(`
      ===========================
      #   DADOS DA SIMULAÇÃO   #
      ---------------------------
      *Status do servidor:     ${{ 0: 'Ocioso', 1: 'Em atendimento' }[statusServer]}
      *Relogio de simulacao:   ${simulationClock.toFixed(2)}
      *Nº de pessoas em fila:  ${queueSize}
      *Cliente em atendimento: ${currentClient}
      *Tempos de chegada:      [ ${queueArrival} ]
      ---------------------------
      *Tempo do ultimo evento: ${timeLastEvent.toFixed(2)}
      *Proximo evento:         ${
        simulationEnd ? 'Sem proximo evento' : { input: 'Chegada', output: 'Saida' }[nextEvent]
      }
      *Proxima chegada:        ${
        nextArrival < timeSimulation ? nextArrival.toFixed(2) : 'Sem proximas chegadas!'
      }
      *Proxima saida:          ${
        nextOutput < 9999999999 ? nextOutput.toFixed(2) : 'Sem proxima saida!'
      }
      ---------------------------
      *Area sob Q(t):          ${areaSobQt.toFixed(2)}
      *Area sob B(t):          ${areaSobBt.toFixed(2)}
      *Clientes atendidos:     ${clientAttended}
      *Espera total:           ${timeTotalQueue.toFixed(2)}
      ===========================
  `);
};

// generation NPA for next event
function getNextEvent(event) {
  let seed = (x0 * a + c) % m;
  let npa = seed / (m - 1);
  let randomNumber = Math.abs(
    Math.log(npa) * (event === 'input' ? timeMediumArrival : timeMediumAttendance)
  );

  x0 = seed;
  return randomNumber;
}

// calculate areas
const calculateAreaQt = () => (areaSobQt += (simulationClock - timeLastEvent) * queueSize);
const calculateAreaBt = () => (areaSobBt += (simulationClock - timeLastEvent) * statusServer);

// process for arrival or output
function processArrival(arrival) {
  timeLastEvent = simulationClock;
  simulationClock = arrival;
  nextArrival = simulationClock + getNextEvent('input');

  if (statusServer === 0) {
    statusServer = 1;
    nextOutput = simulationClock + getNextEvent('output');
    currentClient = simulationClock.toFixed(2);
  } else {
    calculateAreaQt();
    calculateAreaBt();

    queueArrival.push(arrival.toFixed(2));
    queueSize++;
  }
}

function processOutput(output) {
  timeLastEvent = simulationClock;
  simulationClock = output;
  calculateAreaBt();

  if (queueSize > 0) {
    nextOutput = simulationClock + getNextEvent('output');
    calculateAreaQt();

    currentClient = queueArrival.shift();
    queueSize = queueArrival.length;
    timeTotalQueue += simulationClock - currentClient;
  } else {
    nextOutput = 9999999999;
    statusServer = 0;
  }

  clientAttended++;
}

// main function to run the program
function startSimulation() {
  let index = 0;
  let jumpGenerations = false;
  let continueShowing = '';
  let next = true;

  do {
    showStates();

    console.log(`Geracao atual: ${index}`);
    console.log('\nVoce deseja continuar exibindo os dados? (S/N)\n');

    if (!jumpGenerations) continueShowing = prompt('Resposta: ');
    jumpGenerations = Boolean(continueShowing.toUpperCase() === 'N');

    if (nextEvent === 'input') processArrival(nextArrival);
    else processOutput(nextOutput);

    if (nextArrival > timeSimulation && nextOutput === 9999999999) {
      let timeMediumInQueue = timeTotalQueue / clientAttended;
      let numberMediumInQueue = areaSobQt / simulationClock;
      let occupancyRate = (areaSobBt / simulationClock) * 100;
      simulationEnd = true;
      showStates();

      console.log(`Total de geracoes de estados: ${index + 1}\n`);
      console.log(`Tempo medio na fila: ${timeMediumInQueue.toFixed(2)}`);
      console.log(`Numero medio de clientes na fila: ${numberMediumInQueue.toFixed(2)}`);
      console.log(`Taxa de ocupacao: ${occupancyRate.toFixed(2)}%\n`);

      next = false;
    } else if (nextArrival > timeSimulation) {
      nextEvent = 'output';
    } else {
      //Alternate between input and output
      nextEvent = nextArrival <= nextOutput ? 'input' : 'output';
    }

    index++;
  } while (next);
}

startSimulation();
