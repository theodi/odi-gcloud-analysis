var argv = require("optimist")
		.usage('Usage: $0 [--server <serverURI if not http://localhost:8080>] [--quiet]')
		/*
		.demand([ "memory", "search", "wwwroot" ])
		*/
		.alias("server", "s")
		.default("server", "http://localhost:8080")
		.argv,
	async = require('async'),
	restify = require('restify'),
	_ = require('underscore');

var client = restify.createJsonClient({
	url: argv.server,
	version: '*'
});

var log = function (s) {
	if (!argv.quiet) {
	    var entryDate = new Date();
	    console.log(entryDate.getFullYear() + "/" + (entryDate.getMonth() < 9 ? '0' : '') + (entryDate.getMonth() + 1) + "/" + (entryDate.getDate() < 10 ? '0' : '') + entryDate.getDate() + " " + (entryDate.getHours() < 10 ? '0' : '') + entryDate.getHours() + ":" + (entryDate.getMinutes() < 10 ? '0' : '') + entryDate.getMinutes() + ":" + (entryDate.getSeconds() < 10 ? '0' : '') + entryDate.getSeconds() + " - " + s);
	}
}

var getFlattenedCategories = function (callback) {
	client.get('/categories', function(err, req, res, obj) {
		var categories = obj.results,
			flattenedCategories = [ ];
		Object.keys(categories).forEach(function (topCategoryKey) {
			Object.keys(categories[topCategoryKey]).forEach(function (secondLevelCategoryKey) {
				flattenedCategories.push({
					topLevel: topCategoryKey,
					secondLevel: secondLevelCategoryKey,
					url: categories[topCategoryKey][secondLevelCategoryKey].url
				});
			});
		});
		callback(null, flattenedCategories);
	});
};

var getUniqueProductsIdList = function (callback) {
	var productIds = [ ];
	log("Fetching the list of categories...");
	getFlattenedCategories(function (err, categories) {
		async.eachSeries(categories, function (category, callback) {
			log("Fetching the product ids in category: " + category.topLevel + " > " + category.secondLevel + "...");
			client.get('/list/' + encodeURIComponent(category.topLevel) + '/' + encodeURIComponent(category.secondLevel), function(err, req, res, obj) {
				productIds = _.uniq(productIds.concat(obj.results));
				log("Fetched " + obj.results.length + " ids. Found so far " + productIds.length + " unique ids.");
				callback(err);
			});
		}, function (err) {
			callback(err, productIds);
		});
	});
}

getUniqueProductsIdList(function (err, productIds) {
	console.log(JSON.stringify(productIds));
});