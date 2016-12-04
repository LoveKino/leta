'use strict';

/**
 * dsl used to contruct lambda json
 *
 * ## translate lambda to json
 *
 * 1. meta data
 *
 *  j ←→ ['d', j]
 *
 * 2. predicate
 *
 *  f(x, y, z) ←→ ['p', 'f', [t(x), t(y), t(z)]]
 *
 * 3. variable
 *
 *  x ←→ ['v', 'x']
 *
 * 4. abstraction
 *
 *  חx₁x₂...x.e ←→ ['l', ['x₁', 'x₂', ...], t(e)]
 *
 * 5. an application
 *
 *  e₁e₂e₃... ←→ ['a', [t(e₁), t(e₂), ...]]
 *
 * ## usage
 *
 * 1. import predicate set
 *
 * let add = c.require('add');
 * let sub = c.require('sub');
 *
 * 2. construct lambda
 *
 *  - meta
 *
 *    just itself
 *
 *    e = j
 *
 *  - varibale
 *
 *    e = c.v('x')
 *
 *  - predicate
 *
 *    e = add(1, c.v('x'))
 *
 *  - abstraction
 *
 *    e = c.r(['x'], add(1, c.v('x'))
 *
 *  - an application
 *
 *    e = e₁(e₂)
 *
 *  expression = () => expression
 *  expression.json
 */

let {
    map
} = require('bolzano');

let {
    isFunction
} = require('basetype');

let unique = {};

/**
 * get expression
 */
let exp = (json) => {
    // application
    let e = (...args) => {
        return exp(['a', getJson(e), map(args, getJson)]);
    };
    e.unique = unique;
    e.json = json;
    return e;
};

/**
 * import predicate
 */
let requirePredicate = (name) => (...args) => {
    /**
     * predicate
     */
    return exp(['p', name, map(args, getJson)]);
};

/**
 * define variable
 *
 * TODO type
 */
let v = (name) => exp(['v', name]);

/**
 * e → חx₁x₂...x . e
 */
let r = (...args) => exp(['l', args.slice(0, args.length - 1), getJson(args[args.length - 1])]);

let isExp = v => isFunction(v) && v.unique === unique;

let getJson = (e) => isExp(e) ? e.json : ['d', e];

module.exports = {
    require: requirePredicate,
    r,
    v,
    getJson
};
