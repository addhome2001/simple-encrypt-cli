const inquirer = require('inquirer');
const { AES, DES, TripleDES, Rabbit, RC4, enc } = require('crypto-js');
const Caesar = require('ebg13');

const separator = new inquirer.Separator();

const algorithms = {
  AES,
  DES,
  RC4,
  Rabbit,
  TripleDES,
  Caesar,
};

const getProcessor = (purpose, algorithm) => {
  const algorithmMethods = algorithms[algorithm];
  if (algorithm === 'Caesar') {
    return algorithmMethods;
  }

  if (algorithmMethods.hasOwnProperty(purpose)) {
    return algorithmMethods[purpose];
  }

  throw Error(`There is no ${algorithm} algorithm.`);
};

const getPassphrase = async isEncrypt => {
  let answer;

  if (isEncrypt) {
    answer = await inquirer.prompt(encryptQuestions);
    if (answer.passphrase !== answer.passphraseAgain) {
      throw Error('The passphrase and passphraseAgain is not the same.');
    }
  } else {
    answer = await inquirer.prompt(decryptQuestions);
  }

  return answer.passphrase;
}

const getDecodedResult = (isEncrypt, result) =>
  isEncrypt ? result.toString() : result.toString(enc.Utf8);

module.exports = async () => {
  try {
    const { purpose, input } = await inquirer.prompt([
      {
        type: 'list',
        name: 'purpose',
        message: 'What is your purpose?',
        choices: ['Encrypt', 'Decrypt'],
        filter: val => val.toLowerCase(),
      },
      {
        type: 'input',
        name: 'input',
        message: 'What is your input?',
        validate: input => !!input.length || 'The input is empty.'
      },
    ]);
    const decryptQuestions = [
      {
        type: 'password',
        name: 'passphrase',
        message: 'What is your passphrase?',
        default: ''
      },
    ];

    const encryptQuestions = [
      {
        type: 'password',
        name: 'passphrase',
        message: 'What is your passphrase?',
        default: ''
      },
      {
        type: 'password',
        name: 'passphraseAgain',
        message: 'What is your passphrase again?',
        default: ''
      },
    ];

    const isEncrypt = purpose === 'encrypt';

    const interaction = async (input, purpose, isEncrypt) => {
      const { algorithm } = await inquirer.prompt([
        {
          type: 'list',
          name: 'algorithm',
          message: 'What kind of algorithm do you prefer?',
          choices: Object.keys(algorithms),
        },
      ]);
      const passphrase = await getPassphrase(isEncrypt);
      const processor = getProcessor(purpose, algorithm);
      const result = getDecodedResult(
        isEncrypt,
        processor(input, algorithm === 'Caesar' ? +passphrase : passphrase)
      );
      const { toBeContinued } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'toBeContinued',
          message: 'To be continued?',
          default: false
        },
      ]);

      return toBeContinued ? a(result, purpose, isEncrypt) : result;
    }

    const result = await interaction(input, purpose, isEncrypt);

    console.log(result);
  } catch (e) {
    console.error(e.message);
    process.exit(0);
  }
}