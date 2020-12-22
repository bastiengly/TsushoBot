const numbers = require("numbers");

const getRandomValue = (mean, stdev, method) => {
  return method(1, mean, stdev);
};

const getRandomInt = (min, max, maxInclusive = true) => {
  const minimum = Math.ceil(min);
  const maximum = Math.floor(max);
  return maxInclusive
    ? Math.floor(Math.random() * (maximum - minimum + 1) + minimum)
    : Math.floor(Math.random() * (maximum - minimum) + minimum);
};

/**
 * Returns a random object from a weighted list
 *
 * Requires each object in the array to have a `.weight` property
 * @param {Array} arr Array of objects, e.g. [{ value: '1', weight: 10 }, { value: '2', weight: 2 }, ...]
 * @return {Object} A random `object` from the passed array
 */
const getWeightedRandom = (arr) => {
  let total = 1;
  arr.forEach((object) => {
    total += object.weight;
  });

  const threshold = getRandomInt(0, total, false);

  total = 0;
  for (const object of arr) {
    total += object.weight;
    if (total >= threshold) return object;
  }
};

const checkIfNegative = (value) => {
  return value <= 0 ? 0 : value;
};

/**
 * Returns a random number distributed normally/logarithmically
 *
 * @param   {bool}        isLogarithmic   Numbers distribution switch, pass true for Logarithmic Distribution
 * @param   {float}       mean            Mean or mu
 * @param   {float}       stdev           Sigma or standard deviation
 * @param   {float}       modifier        Output multiplier
 * @param   {bool}        checkNegative   If true, clamps the returned value - if the rolled value is negative, return value is set to 0
 *
 * @return  {integer}
 */
const distribution = (isLogarithmic, mean, stdev, modifier = 1, checkNegative = false) => {
  const distributionType =
    isLogarithmic === true ? numbers.random.distribution.logNormal : numbers.random.distribution.normal;

  const value = Math.floor(parseInt(getRandomValue(mean, stdev, distributionType) * modifier, 10));

  return checkNegative ? checkIfNegative(value) : value;
};

const normalDistribution = (mean, stdev, modifier = 1, checkNegative = false) => {
  return distribution(false, mean, stdev, modifier, checkNegative);
};

const logNormalDistribution = (mean, stdev, modifier = 1, checkNegative = false) => {
  return distribution(true, mean, stdev, modifier, checkNegative);
};

const getRandomArrayIndex = (array) => {
  return array[getRandomInt(0, array.length - 1)];
};

module.exports = {
  normalDistribution,
  logNormalDistribution,
  getRandomInt,
  getWeightedRandom,
  getRandomArrayIndex,
};
