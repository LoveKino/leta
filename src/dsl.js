'use strict';

/**
 * dsl used to contruct lambda json
 *
 * ח based on predicates and json expansion
 *
 * e ::= json                    as meta data, also a pre-defined π expression
 *   |   x                       variable
 *   |   predicate               predicate is a pre-defined abstraction
 *   |   חx.e                    abstraction
 *   |   e1e2                    application
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
    map, contain
} = require('bolzano');

let {
    isFunction, likeArray, funType
} = require('basetype');

let unique = {};

const EXPRESSION_PREFIXES = ['a', 'p', 'f', 'v', 'd', 'l'];
const [
    APPLICATION_PREFIX,
    PREDICATE_PREFIX,
    PREDICATE_VARIABLE_PREFIX,
    VARIABLE_PREFIX,
    META_DATA_PREFIX,
    ABSTRACTION_PREFIX
] = EXPRESSION_PREFIXES;

/**
 * get expression
 */
let exp = (json) => {
    // application
    let e = (...args) => {
        return exp([APPLICATION_PREFIX, getJson(e), map(args, getJson)]);
    };
    e.unique = unique;
    e.json = json;
    return e;
};

/**
 * import predicate
 */
let requirePredicate = (...args) => {
    if (args.length > 1) {
        return map(args, genPredicate);
    } else {
        return genPredicate(args[0]);
    }
};

let genPredicate = (name = '') => {
    let predicate = (...args) => {
        /**
         * predicate
         */
        return exp([PREDICATE_PREFIX, name.trim(), map(args, getJson)]);
    };
    predicate.unique = unique;
    predicate.json = [PREDICATE_VARIABLE_PREFIX, name];

    return predicate;

};

/**
 * define variable
 *
 * TODO type
 */
let v = (name) => exp([VARIABLE_PREFIX, name]);

/**
 * e → חx₁x₂...x . e
 */
let r = (...args) => exp([ABSTRACTION_PREFIX, args.slice(0, args.length - 1), getJson(args[args.length - 1])]);

let isExp = v => isFunction(v) && v.unique === unique;

let getJson = (e) => isExp(e) ? e.json : [META_DATA_PREFIX, e];

let getExpressionType = funType((json) => {
    let type = json[0];
    if (!contain(EXPRESSION_PREFIXES, type)) {
        throw new Error(`unexpected expression type ${json[0]}. The context json is ${JSON.stringify(json, null, 4)}`);
    }
    return type;
}, [likeArray]);

let destruct = (json) => {
    let type = getExpressionType(json);

    switch (type) {
        case META_DATA_PREFIX:
            return {
                type,
                metaData: json[1]
            };
        case VARIABLE_PREFIX:
            return {
                type,
                variableName: json[1]
            };
        case ABSTRACTION_PREFIX:
            return {
                abstractionArgs: json[1],
                abstractionBody: json[2],
                type,
            };
        case PREDICATE_PREFIX:
            return {
                predicateName: json[1],
                predicateParams: json[2],
                type,
            };
        case APPLICATION_PREFIX:
            return {
                applicationFun: json[1],
                applicationParams: json[2],
                type
            };
        case PREDICATE_VARIABLE_PREFIX:
            return {
                type,
                predicateName: json[1]
            };
    }
};

module.exports = {
    require: requirePredicate,
    method: requirePredicate,
    r,
    v,
    getJson,

    getExpressionType,

    APPLICATION_PREFIX,
    PREDICATE_PREFIX,
    PREDICATE_VARIABLE_PREFIX,
    VARIABLE_PREFIX,
    META_DATA_PREFIX,
    ABSTRACTION_PREFIX,

    EXPRESSION_PREFIXES,

    destruct
};
