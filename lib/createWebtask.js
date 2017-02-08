var Chalk = require('chalk');
var Logs = require('../lib/logs');
var WebtaskCreator = require('../lib/webtaskCreator');
var Url = require('url');
var _ = require('lodash');


module.exports = createWebtask;


function createWebtask(args, options) {
    if (!options) options = {};
    if (!options.action) options.action = 'created';
    
    var profile = args.profile;

    var createWebtask = WebtaskCreator(args, {
        onGeneration: onGeneration,
        onError: onError,
    });
    var logger = args.watch
        ?   Logs.createLogStream(profile)
        :   console;
    var log = args.watch
        ?   _.bindKey(logger, 'info')
        :   _.bindKey(logger, 'log');
    var logError = _.bindKey(logger, 'error');

    return createWebtask(profile);
    
    
    function onError(build) {
        formatError(build);
    }
    
    function onGeneration(build) {
        formatOutput(build, build.webtask.url);
    }
    
    function formatError(build, url) {
        build.stats.errors = build.stats.errors.map(err => err.split('|').slice(0, -1).join('|'));
        
        if (args.watch) {
            var output = { generation: build.generation };
            
            _.forEach(build.stats.errors, function (error) {
                logError(output, 'Bundling failed: %s', error);
            });
        } else if (args.output === 'json') {
            var json = {
                name: args.name,
                container: args.profile.container,
                errors: build.stats.errors,
            };
            
            logError(JSON.stringify(json, null, 2));
        } else {
            logError(Chalk.red('Bundling failed'));
            build.stats.errors.forEach(err => logError(err));
        }
    }
    
    function formatOutput(build, url) {
        var output;
        
        if (args.watch) {
            output = { generation: build.generation, container: build.webtask.container };
            
            if (args.showToken) {
                output.token = build.webtask.token;
            }
            
            log(output, 'Webtask %s: %s', options.action, url);
        } else if (args.output === 'json') {
            output = { url: url, name: build.webtask.claims.jtn, container: build.webtask.container };
            
            if (args.showToken) {
                output.token = build.webtask.token;
            }
            
            log(JSON.stringify(output, null, 2));
        } else if (args.showToken) {
            log(Chalk.green('Webtask token %s') + '\n\n%s\n\nYou can access your webtask at the following url:\n\n%s', options.action, Chalk.gray(build.webtask.token), Chalk.bold(url));
        } else if (options.onOutput) {
            options.onOutput(log, build, url);
        }
        else {
            log(Chalk.green('Webtask %s') + '\n\nYou can access your webtask at the following url:\n\n%s', options.action, Chalk.bold(url));
        }
    }
}