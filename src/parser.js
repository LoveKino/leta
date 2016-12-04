'use strict';

/**
 * translate lambda to json
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
 *  חx₁x₂...x.e ←→ ['l', [t(x₁), t(x₂), ...], t(e)]
 *
 * 5. an application
 *
 *  e₁e₂e₃... ←→ ['a', [t(e₁), t(e₂), ...]]
 */

let {
    isArray, isNumber
} = require('basetype');

let {
    map
} = require('bolzano');

let parseRules = {
    metaData: {
        to: (json) => ['d', json],
        is: headIs('d'),
        from: getItem(1)
    },
    predicate: {
        /**
         * @param name String
         * @param args Array
         *
         * args = [{
         *   type: 'metaData' | 'predicate' | 'variable' | 'abstraction' | 'application',
         *   value
         * }]
         */
        to: (name, args = []) => ['p', name, map(args, t)],
        is: headIs('p'),
        from: getItem([1, 2])
    },
    variable: {
        to: (x) => ['v', x],
        is: headIs('v'),
        from: getItem(1)
    },
    abstraction: {
        /**
         * params = [{type, value}]
         * exp = {type, value}
         */
        to: (params = [], exp) => ['l', map(params, t), t(exp)],
        is: headIs('l'),
        from: getItem([1, 2])
    },
    application: {
        to: (exps = []) => ['a', map(exps, t)],
        is: headIs('a'),
        from: getItem(1)
    }
};

let t = ({
    type, value
}) => parseRules[type](value);

let headIs = (v) => (list) => isArray(list) && v === list[0];

let getItem = (v) => (list) => {
    if (isNumber(v)) {
        return list[v];
    } else if (isArray(v)) {
        return map(v, (i) => {
            return list[i];
        });
    }
};

module.exports = parseRules;
