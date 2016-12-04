'use strict';

/**
 * ח calculus
 *
 * e ::=    x       a variable
 *   |      חx.e    an abstracton (function)
 *   |      e₁e₂    a (function) application
 *
 *
 * using lambda to transfer data
 *  1. using apis to construct a lambda
 *  2. translate lambda to json
 *  3. sending json
 *  4. accept json and execute lambda
 *
 *
 *
 * language: (P, ח, J)
 *
 *  1. J meta data set. The format of meta data is json
 *  2. P: predicate set
 *
 * eg: חx.add(x, 1)
 *      meta data: 1
 *      variable: x
 *      predicate: add
 */

let dsl = require('./src/dsl');
let interpreter = require('./src/interpreter');

module.exports = {
    dsl,
    interpreter
};
