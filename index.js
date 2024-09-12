const fs = require('fs');
const fetch = require('node-fetch');

const sucess = [];
const erros = [];
const all = [];

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

  function findUrlBlip(response, key){
    try {
        for (const block in response.resource){
            if(response.resource[block].$enteringCustomActions.length > 0) {
                response.resource[block].$enteringCustomActions.forEach(action => {
                    if(action.type == "ProcessHttp"){
                        all.push({
                            bot: key,
                            bloco: response.resource[block].$title,
                            acao: action["$title"],
                            uri: action.settings.uri
                        })
                        if(action.settings.uri.toLowerCase().includes("msging.net")){
                            erros.push({
                                bot: key,
                                bloco: response.resource[block].$title,
                                acao: action["$title"],
                                uri: action.settings.uri
                            })
                        }
                        if(action.settings.uri.toLowerCase().includes("blipapi")){
                          sucess.push({
                            bot: key,
                            bloco: response.resource[block].$title,
                            acao: action["$title"],
                            uri: action.settings.uri
                        })
                        }
                    }       
                });
            }
            if(response.resource[block].$leavingCustomActions.length > 0) {
                response.resource[block].$leavingCustomActions.forEach(action => {
                    if(action.type == "ProcessHttp"){
                        all.push({
                            bot: key,
                            bloco: response.resource[block].$title,
                            acao: action["$title"],
                            uri: action.settings.uri
                        })
                        if(action.settings.uri.toLowerCase().includes("msging.net")){
                            erros.push({
                                bot: key,
                                bloco: response.resource[block].$title,
                                acao: action["$title"],
                                uri: action.settings.uri
                            })
                        }
                        if(action.settings.uri.toLowerCase().includes("blipApi")){
                          sucess.push({
                            bot: key,
                            bloco: response.resource[block].$title,
                            acao: action["$title"],
                            uri: action.settings.uri
                        })
                        }
                    }      
                });
            }
        }
    } catch (e) {
        console.log("deu ruim na funcao");
    }  
  }

  function printResult(){
    console.log("-------Ações erradas-------")
    console.table(erros);

    console.log("-------Ações certas-------")
    console.table(sucess);

    console.log("-------Todas acoes-------")
    console.table(all);
  }

async function main() {
  try {
    const config = await readJsonFile('./keys.json');

    const baseUrl = "https://msging.net/commands";

    for (const key in config) {
        if(key.startsWith('bot')){
            const data = await fetchData(baseUrl, config[key]);
            findUrlBlip(data, key);
        }
    }
    printResult();
  } catch (error) {
    console.error('Erro:', error);
  }
}

main();
