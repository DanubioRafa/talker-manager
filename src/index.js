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

const validateLogin = (req, res, next) => {
  const { body } = req;
  const reEmail = /^\S+@\S+\.\S+$/;
  if (!body.email) {
    return res.status(400).json({ message: 'O campo "email" é obrigatório' });
  } 
  if (!body.password) {
    return res.status(400).json({ message: 'O campo "password" é obrigatório' });
  }
  if (!reEmail.test(body.email)) {
    return res.status(400).json({ message: 'O "email" deve ter o formato "email@email.com"' });
  }
  if (body.password.length < 6) {
    return res.status(400).json({ message: 'O "password" deve ter pelo menos 6 caracteres' });
  }

  next();
};

app.post('/login', validateLogin, (_req, res) => {
  const token = createToken();

  res.status(200).json({ token });
});

const validateToken = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    res.status(401).json({ message: 'Token não encontrado' });
  }

  if (authorization.length !== 16) {
    res.status(401).json({ message: 'Token inválido' });
  } else {
    next();
  }
};

const validateOneField = (field, index, body) => {
  const flexBody = index < 3 ? body : body.talk;
  if (!flexBody && index > 2) return true;

  if (!(field in flexBody)) {
    return true;
  }
    return false;
};

const validateFields = (req, res, next) => {
  const { body } = req;
  const expectedFields = ['name', 'age', 'talk', 'watchedAt', 'rate'];
  let validated = '';

  expectedFields.forEach((field, index) => {
    if (validateOneField(field, index, body) === true && validated.length === 0) { 
      validated = field;
    }
  });
  
  if (validated) {
    return res.status(400).json({ message: `O campo "${validated}" é obrigatório` });
  }

  next();
};

const validateFormatDate = (req, res, next) => {
  const { body } = req;
  const reDate = /^(0?[1-9]|[12][0-9]|3[01])[/-](0?[1-9]|1[012])[/-]\d{4}$/;
  if (!reDate.test(body.talk.watchedAt)) {
    return res.status(400).json({ message: 'O campo "watchedAt" deve ter o formato "dd/mm/aaaa"' });
  }

  next();
};

const validateRate = (req, res, next) => {
  const { talk } = req.body;
  if (talk.rate < 1 || talk.rate > 5) {
    return res.status(400).json({ message: 'O campo "rate" deve ser um inteiro de 1 à 5' });
  } 
    next();
};

const validateTalker = (req, res, next) => {
  const { body } = req;

  if (body.name !== undefined ? body.name.length < 3 : false) {
    return res.status(400).json({ message: 'O "name" deve ter pelo menos 3 caracteres' });
  }

  if (body.age < 18) {
    return res.status(400).json({ message: 'A pessoa palestrante deve ser maior de idade' });
  }
  next();
};

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