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

module.exports = { validateFields,
   validateFormatDate,
   validateRate,
   validateTalker,
   validateToken,
   validateLogin };