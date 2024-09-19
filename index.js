const { createSecretKey } = require('crypto');
const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');
const readline = require('readline');
const _ = require('lodash');

const sucess = [];
const erros = [];
const all = [];
const botsNeedsChange = [];

function readJsonFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
}

async function fetchData(apiUrl, apiKey) {
  try {
    const requestBody = {
      "id": "{{$guid}}",
      "method": "get",
      "uri": "/buckets/blip_portal:builder_working_flow"
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
  }
}

async function findUrlBlip(response, key) {
  let isChanged = false;

  try {
    let newResponse = response;
    const botId = newResponse.to.split('@')[0];

    for (const block in newResponse.resource) {
      if (newResponse.resource[block].$enteringCustomActions.length > 0) {
        newResponse.resource[block].$enteringCustomActions.forEach(action => {
          if (action.type == "ProcessHttp") {
            all.push({
              bot: botId,
              bloco: newResponse.resource[block].$title,
              acao: action["$title"],
              uri: action.settings.uri
            })
            if (action.settings.uri.toLowerCase().includes("msging.net")) {
              isChanged = true;
              erros.push({
                bot: botId,
                bloco: newResponse.resource[block].$title,
                acao: action["$title"],
                uri: action.settings.uri
              })
              action.settings.uri = "{{resource.blipApi@commandsUrl}}";
            } else if (action.settings.uri.toLowerCase().includes("blipapi")) {
              sucess.push({
                bot: botId,
                bloco: newResponse.resource[block].$title,
                acao: action["$title"],
                uri: action.settings.uri
              })
            }
          }
        });
      }
      if (newResponse.resource[block].$leavingCustomActions.length > 0) {
        newResponse.resource[block].$leavingCustomActions.forEach(action => {
          if (action.type == "ProcessHttp") {
            all.push({
              bot: botId,
              bloco: newResponse.resource[block].$title,
              acao: action["$title"],
              uri: action.settings.uri
            })
            if (action.settings.uri.toLowerCase().includes("msging.net")) {
              isChanged = true;
              erros.push({
                bot: botId,
                bloco: newResponse.resource[block].$title,
                acao: action["$title"],
                uri: action.settings.uri
              })
              action.settings.uri = "{{resource.blipApi@commandsUrl}}";
            } else if (action.settings.uri.toLowerCase().includes("blipApi")) {
              sucess.push({
                bot: botId,
                bloco: newResponse.resource[block].$title,
                acao: action["$title"],
                uri: action.settings.uri
              })
            }
          }
        });
      }
    }

    if (isChanged) {
      createNewJson(newResponse, botId);
    }
  } catch (e) {
    console.log("deu ruim na funcao");
  }
}
async function createNewJson(response, botId) {
  try {
    const folder = './';
    let resultFolder = '';

    fs.readdirSync(folder).map(fileName => {
      if (fileName.startsWith("result")) {
        resultFolder = fileName;
      }
    })

    const fullPath = path.join(resultFolder, `${botId.toUpperCase()}.json`);
    const jsonString = JSON.stringify(response, null, 2);

    fs.writeFile(fullPath, jsonString, (err) => {
      if (err) {
        console.error('Erro ao escrever o arquivo: ' + botId, err);
      } else {
        console.log(`Arquivo JSON ${botId.toUpperCase()} criado com sucesso!`);
      }
    });
  } catch (e) {
    console.log("erro ao criar novo json");
  }
}

function printResult() {
  console.log("-------Ações erradas-------")
  console.table(erros);

  console.log("-------Ações certas-------")
  console.table(sucess);

  console.log("-------Todas acoes-------")
  console.table(all);
}

async function clearResultFolder() {
  let resultFoderName = '';

  fs.readdirSync("./").map(fileName => {
    if (fileName.startsWith("result")) {
      resultFoderName = fileName;
    }
  })

  const folder = `./${resultFoderName}`;
  try {
    if (fs.existsSync(folder)) {
      const files = fs.readdirSync(folder);

      for (const file of files) {
        const filePath = path.join(folder, file);
        fs.unlinkSync(filePath);
      }
    }
  } catch (err) {
    console.error(err)
  }
}
async function getContractName(configs) {
  const folder = './';
  let resultFolder = '';

  fs.readdirSync(folder).map(fileName => {
    if (fileName.startsWith("result")) {
      resultFolder = fileName;
    }
  })

  try {
    if (configs.tenantId) {
      fs.renameSync(resultFolder, `result - ${configs.tenantId.toUpperCase()}`)
      return `result - ${configs.tenantId.toUpperCase()}`;
    } else {
      const contract = await questionAsync("Qual nome do contrato?");
      fs.renameSync(resultFolder, `result - ${contract.toUpperCase()}`)
      return `result - ${contract.toUpperCase()}`;
    }
  } catch (err) {
    console.error(err)
  }
}
function questionAsync(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  try {
    const config = await readJsonFile('./keys.json');

    await clearResultFolder();
    await getContractName(config);

    const baseUrl = "https://msging.net/commands";

    for (const key in config) {
      if (key.startsWith('bot')) {
        const data = await fetchData(baseUrl, config[key]);

        await findUrlBlip(data, key);
      }
    }
    printResult();

  } catch (error) {
    console.error('Erro:', error);
  }
}

main();
