'use strict';

let {
    map, reduce
} = require('bolzano');

let {
    funType, isObject, isFunction
} = require('basetype');

let {
    hasOwnProperty
} = require('jsenhance');

/**
 * used to interpret lambda json
 *
 * TODO
 *
 * basic operation:
 *  - α conversion (renaming) חx.e ←→ חy.[y/x]e
 *  - β reduction (application) (חx.e₁)e₂ → [e₂/x]e₁
 *  - Ŋ reduction     חx.ex → e
 */

/**
 * d: meta data
 * v: variable
 * l: abstraction
 * p: predicate
 * a: application
 *
 * TODO
 *
 * 1. name capture
 * 2. reduce
 *
 * @param predicateSet Object
 *  a map of predicates
 */

module.exports = (predicateSet) => {
    return (data) => {
        // TODO check data format
        let translate = funType((json, ctx) => {
            let translateWithCtx = (data) => translate(data, ctx);

            let error = (msg) => {
                throw new Error(msg + ' . Context json is ' + JSON.stringify(json));
            };

            switch (json[0]) {
                case 'd': // meta data
                    return json[1];
                case 'v': // variable
                    var context = ctx;
                    while (context) {
                        if (hasOwnProperty(context.curVars, json[1])) {
                            return context.curVars[json[1]];
                        }
                        context = context.parentCtx;
                    }

                    return error(`undefined variable ${json[1]}`);
                case 'l': // subtraction
                    return (...args) => {
                        // update variable map
                        return translate(json[2], {
                            curVars: reduce(json[1], (prev, name, index) => {
                                prev[name] = args[index];
                                return prev;
                            }, {}),
                            parentCtx: ctx
                        });
                    };
                case 'p': // predicate
                    var predicate = predicateSet[json[1]];
                    if (!isFunction(predicate)) {
                        return error(`missing predicate ${json[1]}`);
                    }
                    return predicate(...map(json[2], translateWithCtx));
                case 'a': // application
                    var subtraction = translateWithCtx(json[1]);
                    if (!isFunction(subtraction)) {
                        return error(`expected function, but got ${subtraction} from ${json[1]}.`);
                    }
                    return subtraction(...map(json[2], translateWithCtx));
                default:
                    return error(`unexpected type ${json[0]}`);
            }
        }, [
            isObject, isObject
        ]);

        return translate(data, {
            curVars: {}
        });
    };
};
