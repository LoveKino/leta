'use strict';

let {
    map, reduce
} = require('bolzano');

let {
    funType, isObject, isFunction
} = require('basetype');

let {
    hasOwnProperty, get
} = require('jsenhance');

let {
    APPLICATION_PREFIX,
    PREDICATE_PREFIX,
    PREDICATE_VARIABLE_PREFIX,
    VARIABLE_PREFIX,
    META_DATA_PREFIX,
    ABSTRACTION_PREFIX,

    desctruct
} = require('./dsl');

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
 * f: predicate as variable
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

            let {
                type,
                metaData,

                variableName,

                predicateName,
                predicateParams,

                abstractionArgs,
                abstractionBody,

                applicationFun,
                applicationParams
            } = desctruct(json);

            switch (type) {
                case META_DATA_PREFIX: // meta data
                    return metaData;

                case VARIABLE_PREFIX: // variable
                    var context = ctx;
                    while (context) {
                        if (hasOwnProperty(context.curVars, variableName)) {
                            return context.curVars[variableName];
                        }
                        context = context.parentCtx;
                    }

                    return error(`undefined variable ${variableName}`);

                case ABSTRACTION_PREFIX: // abstraction
                    return (...args) => {
                        // update variable map
                        return translate(abstractionBody, {
                            curVars: reduce(abstractionArgs, (prev, name, index) => {
                                prev[name] = args[index];
                                return prev;
                            }, {}),
                            parentCtx: ctx
                        });
                    };

                case PREDICATE_PREFIX: // predicate
                    var predicate = get(predicateSet, predicateName);
                    if (!isFunction(predicate)) {
                        return error(`missing predicate ${predicateName}`);
                    }
                    return predicate(...map(predicateParams, translateWithCtx));

                case APPLICATION_PREFIX: // application
                    var abstraction = translateWithCtx(applicationFun);
                    if (!isFunction(abstraction)) {
                        return error(`expected function, but got ${fun} from ${applicationFun}.`);
                    }
                    return abstraction(...map(applicationParams, translateWithCtx));

                case PREDICATE_VARIABLE_PREFIX: // predicate as a variable
                    var fun = get(predicateSet, predicateName);
                    if (!isFunction(fun)) {
                        return error(`missing predicate ${predicateName}`);
                    }
                    return fun;
            }
        }, [
            isObject, isObject
        ]);

        return translate(data, {
            curVars: {}
        });
    };
};
