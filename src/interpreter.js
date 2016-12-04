'use strict';

let {
    map, reduce
} = require('bolzano');

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
        let translate = (json, ctx) => {
            let translateWithCtx = (data) => {
                return translate(data, ctx);
            };

            switch (json[0]) {
                case 'd': // meta data
                    return json[1];
                case 'v': // variable
                    var context = ctx;
                    while (context) {
                        if (context.curVars.hasOwnProperty(json[1])) {
                            return context.curVars[json[1]];
                        }
                        context = context.parentCtx;
                    }

                    throw new Error(`unexpected variable ${json[1]}`);
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
                    return predicateSet[json[1]](...map(json[2], translateWithCtx));
                case 'a': // application
                    return translateWithCtx(json[1])(...map(json[2], translateWithCtx));
            }
        };

        return translate(data, {
            curVars: {}
        });
    };
};
