const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(express.json());
const fs = require('fs').promises;

const HTTP_OK_STATUS = 200;
const PORT = '3000';

// não remova esse endpoint, e para o avaliador funcionar *
app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
});

app.listen(PORT, () => {
  console.log('Online');
});

const { validateFields,
    validateFormatDate,
     validateRate, validateTalker,
      validateToken, validateLogin } = require('./services/validations');

const readFile = async () => {
  try {
    const readTalker = await fs.readFile(`${__dirname}/talker.json`, 'utf-8');

    const parseTalker = await JSON.parse(readTalker);

    return parseTalker;
  } catch (error) {
    return (`Erro na leitura do arquivo ${error}`);
  }
};

app.get('/talker', async (_req, res) => {
    const parseTalker = await readFile();

    return res.status(200).json(parseTalker);
});

app.get('/talker/search?', validateToken, async (req, res) => {
  const parseTalkerArchive = await readFile();
  const { query } = req;
  
  const talkerFound = parseTalkerArchive.filter((talker) => talker.name.startsWith(query.q));
  res.status(200).json(talkerFound);
});

app.get('/talker/:id', async (req, res) => {
    const parseTalker = await readFile();
    const { id } = req.params;
    const foundTalker = parseTalker.find((talker) => Number(id) === talker.id);

    if (foundTalker) {
      return res.status(200).json(foundTalker);
    } 
    return res.status(404).json({ message: 'Pessoa palestrante não encontrada' });
});

const createToken = () => {
  let token = '';
  for (let index = 0; index < 16; index += 1) {
    const randomChar = Math.floor(Math.random() * 10);
    token += (randomChar);
  }

  return token;
};

app.post('/login', validateLogin, (_req, res) => {
  const token = createToken();

  res.status(200).json({ token });
});

app.post('/talker', validateToken, validateFields, validateTalker,
 validateRate, validateFormatDate, async (req, res) => { 
    const parseTalker = await readFile();
    const newTalker = { ...req.body, id: parseTalker.length + 1 };
    const allTalkers = JSON.stringify([...parseTalker, newTalker]);
    fs.writeFile(`${__dirname}/talker.json`, allTalkers);
    return res.status(201).json(newTalker);
});

const writeOnFile = async (newFile) => {
  const newTalkerArchive = JSON.stringify(newFile);
  await fs.writeFile(`${__dirname}/talker.json`, newTalkerArchive);
};

app.put('/talker/:id', validateToken, validateFields, validateTalker,
validateRate, validateFormatDate, async (req, res) => {
  const parseTalkerArchive = await readFile();
  const { params: { id }, body } = req;
  const paramId = Number(id);

  const indexOfId = parseTalkerArchive.findIndex((talker) => talker.id === paramId);
  parseTalkerArchive.splice(indexOfId, 1, { id: paramId, ...body });
  const newTalker = parseTalkerArchive[indexOfId];

  writeOnFile(parseTalkerArchive);
  
  res.status(200).json(newTalker);
});

app.delete('/talker/:id', validateToken, async (req, res) => {
  const parseTalkerArchive = await readFile();
  const { params: { id } } = req;
  const paramId = Number(id);
  const indexOfId = parseTalkerArchive.findIndex((talker) => talker.id === paramId);
  parseTalkerArchive.splice(indexOfId, 1);

  await writeOnFile(parseTalkerArchive);
  res.status(204).json({ message: 'Talker excluido' });
});
