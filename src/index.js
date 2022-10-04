const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const HTTP_OK_STATUS = 200;
const PORT = '3000';

// não remova esse endpoint, e para o avaliador funcionar *
app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
});

app.listen(PORT, () => {
  console.log('Online');
});

const fs = require('fs').promises;

app.get('/talker', async (req, res) => {
  try {
    const readTalker = await fs.readFile('./talker.json'); 
    const parseTalker = JSON.parse(readTalker);

    return res.status(200).json(parseTalker);
  } catch (error) {
    console.log(`Erro na leitura do arquivo ${error}`);
  }
});

app.get('/talker/:id', async (req, res) => {
  try {
    const readTalker = await fs.readFile('./talker.json'); 
    const parseTalker = JSON.parse(readTalker);
    const { id } = req.params;

    const foundTalker = parseTalker.find((talker) => Number(id) === talker.id);

    if (foundTalker) {
      return res.status(200).json(foundTalker);
    } 
    return res.status(404).json({ message: 'Pessoa palestrante não encontrada' });
  } catch (error) {
    console.log(`Erro na leitura do arquivo ${error}`);
  }
});

const createToken = () => {
  let token = '';
  for (let index = 0; index < 16; index += 1) {
    const randomChar = Math.floor(Math.random() * 10);
    token += (randomChar);
  }

  return token;
};

app.post('/login', async (req, res) => {
  const token = createToken();

  res.status(200).json({ token });
});
