//"Clap Emoji" Twitter bot by Serena Parr
//ITP Programming A2Z Fall 2016 final project
//
//Thanks to: 
//Dan Shiffman for Twitter bot and regular expression tutorials
//Dan Shiffman for Twitter bot node.js boilerplate
//Neil Cline for array queue architecture tutorial
//Matthew Rothenberg for Emoji Data node.js library and Medium post explaining emoji standardization:
//https://medium.com/@mroth/how-i-built-emojitracker-179cfd8238ac#.954tr22df
//Twit API client for node.js

var EmojiData = require('emoji-data');
var Twit = require('twit');
var fs = require('fs');

var config = require('./config');
var T = new Twit(config);

console.log('emojiFinder.js is starting');

// var stream = T.stream('statuses/sample');
// console.log(stream);

var stream = T.stream('statuses/filter', {
    track: '👏'
});

//empty array of yells to retweet
var theseTweets = [];
//empty dictionary of what's already been retweeted
var alreadyFound = {};

//write theseTweets to a backup file called tweetQueue
var saveTheseTweets = function() {
    fs.writeFile('./files/tweetQueue', JSON.stringify(theseTweets), function(err) {
        if( err ) {
            console.log('there was an error saving to tweetQueue');
        } else {
            console.log( 'saved theseTweets to tweetQueue' );
        }
    });
};

//read from the theseTweets backup file
var loadTheseTweets = function() {
    fs.readFile('./files/tweetQueue', function(err, data) {
        theseTweets = JSON.parse( data );
        console.log('loaded theseTweets from tweetQueue');
        console.log( typeof( theseTweets ) );
    });
}; 

//save tweets that you've already tweeted from the alreadyFound backup file
var saveAlreadyFound = function() {
    fs.writeFile('./files/tweetedAlready', JSON.stringify(alreadyFound), function(err) {
        if( err ) {
            console.log('there was an error saving to tweetedAlready');
        } else {
            console.log( 'saved theseTweets to tweetedAlready' );
        }
    });
};

//check tweets that you've already tweeted against the alreadyFound backup file
var loadAlreadyFound = function() {
    fs.readFile('./files/tweetedAlready', function(err, data) {
        alreadyFound = JSON.parse( data );
        console.log('loaded alreadyFound from tweetedAlready');
        console.log( typeof( alreadyFound ) );
    });
}; 



loadTheseTweets();
loadAlreadyFound();


var tweetIt = function() {
	//if there are tweets that match the regex lookup...
	if(theseTweets.length > 0) {
		//the most recent tweet in the results array (theseTweets) is called "thisTweet"
		var thisTweet = theseTweets[ theseTweets.length - 1 ];
		//tweet thisTweet
		T.post('statuses/retweet/:id', {
	        id: thisTweet
	    }, function(err, data, response) {
	        console.log(data);
	    });
	    theseTweets.pop();
        saveTheseTweets();
	}
}

setInterval(tweetIt, 1000 * 60 * 2);

stream.on('tweet', function(tweet) {

    // console.log('/////////\n');
    // console.log(tweet.text);
    var lastId = 0;

    EmojiData.scan(tweet.text).forEach(
        // emojiMatch

        function(emoji) {
            if (emoji.short_name == 'clap' && lastId !== tweet.id) {
                lastId = tweet.id;
                console.log('Found some clapping at ' + Date.now());

                var clapRegex = /(👏)[(\w)(\d)?]+(\s)?👏[(\w)(\d)?]+(\s)?(👏)/g;
                var clapYelling = tweet.text.match(clapRegex);
                if (clapYelling) {

                	if(!alreadyFound[ tweet.id_str ]) {
                		console.log('This person is yelling');
	                    console.log(tweet.text);
	                    console.log(tweet.id);

	                    theseTweets.push(tweet.id_str);
                        saveTheseTweets();
	                    alreadyFound[ tweet.id_str ] = true;
                        saveAlreadyFound();

	                    console.log(theseTweets);

                	} else {
                		console.log(tweet.id + ' was already tweeted');
                	}
                  

                }  else {
                    console.log('but they were not yelling');
                }
            }
        }
   );
});

