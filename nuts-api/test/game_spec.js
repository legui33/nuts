var _ = require("underscore")._;
var assert = require("assert");
var Player = require("../src/player");
var Game = require("../src/game");

describe('Game', function(){
	it("Doit lancer une exception s'il n'a pas de joueur", function(){
		var buildGame = function(){ new Game(); };
		assert.throws(buildGame);
	});

	it("Doit avoir des joueurs", function(){
		var a = new Player("Alfred", 10);
		var b = new Player("Bernard", 10);
		var c = new Player("Chris", 10);

		var game = new Game([a, b, c], 0);
		assert.deepEqual(game.players, [a, b, c]);
	});

	it("Doit prendre les blinds au démarrage du jeu", function(){
		var a = new Player("Alfred", 10);
		var b = new Player("Bernard", 10);
		var c = new Player("Chris", 10);

		var game = new Game([a, b, c], 0);
		game.start();

		assert.equal(a.stackAmount, 9);
		assert.equal(a.betAmount, 1);
		assert.equal(b.stackAmount, 8);
		assert.equal(b.betAmount, 2);
		assert.equal(c.stackAmount, 10);
	});

	it("Doit distribuer des cartes au démarrage du jeu", function(){
		var a = new Player("Alfred", 10);
		var b = new Player("Bernard", 10);
		var c = new Player("Chris", 10);

		var game = new Game([a, b, c], 0);
		game.start();

		assert.notEqual(a.hand.firstCard, null);
		assert.notEqual(a.hand.secondCard, null);

		assert.notEqual(b.hand.firstCard, null);
		assert.notEqual(b.hand.secondCard, null);

		assert.notEqual(c.hand.firstCard, null);
		assert.notEqual(c.hand.secondCard, null);
	});

	it("Doit lancer un tour de pari", function(){
		var a = new Player("Alfred", 10);
		var b = new Player("Bernard", 10);
		var c = new Player("Chris", 10);

		var game = new Game([a, b, c], 0);
		game.start();
		
		assert.equal(a.actions, null);
		assert.equal(b.actions, null);
		assert.notEqual(c.actions, null);
	});

	it("Doit distribuer le flop lorsque le tour de pari est fini", function(){
		var a = new Player("Alfred", 10);
		var b = new Player("Bernard", 10);
		var c = new Player("Chris", 10);

		var game = new Game([a, b, c], 0);
		game.start();
		
		assert.equal(a.actions, null);
		assert.equal(a.stackAmount, 9);
		assert.equal(b.actions, null);
		assert.equal(b.stackAmount, 8);
		assert.notEqual(c.actions, null);
		assert.equal(c.stackAmount, 10);

		c.actions.fold();

		assert.notEqual(a.actions, null);
		assert.equal(a.stackAmount, 9);
		assert.equal(b.actions, null);
		assert.equal(b.stackAmount, 8);
		assert.equal(c.actions, null);
		assert.equal(c.stackAmount, 10);

		a.actions.call();

		assert.equal(a.actions, null);
		assert.equal(a.stackAmount, 8);
		assert.notEqual(b.actions, null);
		assert.equal(b.stackAmount, 8);
		assert.equal(c.actions, null);
		assert.equal(c.stackAmount, 10);

		b.actions.check();

		assert.equal(game.cards.length, 3);
		assert.equal(game.pot, 4);

		assert.notEqual(a.actions, null);
		assert.equal(a.stackAmount, 8);
		assert.equal(b.actions, null);
		assert.equal(b.stackAmount, 8);
		assert.equal(c.actions, null);
		assert.equal(c.stackAmount, 10);
	});

	it("Doit distribuer le turn lorsque le tour de pari après flop est fini", function(){
		var a = new Player("Alfred", 10);
		var b = new Player("Bernard", 10);
		var c = new Player("Chris", 10);

		var game = new Game([a, b, c], 0);
		game.start();
		c.actions.fold();
		a.actions.call();
		b.actions.check();

		assert.equal(game.cards.length, 3);

		a.actions.check();
		b.actions.bet(2);

		assert.notEqual(a.actions, null);
		assert.equal(a.stackAmount, 8);
		assert.equal(b.actions, null);
		assert.equal(b.stackAmount, 6);

		a.actions.call();

		assert.equal(game.cards.length, 4);
		assert.equal(game.pot, 8);

		assert.notEqual(a.actions, null);
		assert.equal(a.stackAmount, 6);
		assert.equal(b.actions, null);
		assert.equal(b.stackAmount, 6);
	});

	it("Doit distribuer le river lorsque le tour de pari après turn est fini", function(){
		var a = new Player("Alfred", 10);
		var b = new Player("Bernard", 10);
		var c = new Player("Chris", 10);

		var game = new Game([a, b, c], 0);
		game.start();

		//Flop
		c.actions.fold();
		a.actions.call();
		b.actions.check();

		//Turn
		a.actions.check();
		b.actions.bet(2);
		a.actions.call();

		assert.equal(game.cards.length, 4);
		assert.equal(game.pot, 8);

		a.actions.check();
		b.actions.check();

		assert.equal(game.cards.length, 5);
		assert.equal(game.pot, 8);

		assert.notEqual(a.actions, null);
		assert.equal(a.stackAmount, 6);
		assert.equal(b.actions, null);
		assert.equal(b.stackAmount, 6);
	});

	it("Doit faire gagner celui qui a la combinaison la plus élevé", function(){
		var a = new Player("Alfred", 10);
		var b = new Player("Bernard", 10);
		var c = new Player("Chris", 10);

		var game = new Game([a, b, c], 0);
		game.start();

		//Pre-Flop
		c.actions.fold();
		a.actions.call();
		b.actions.check();
		//Flop
		assert.equal(game.cards.length, 3);
		a.actions.check();
		b.actions.bet(2);
		a.actions.call();
		//Turn
		assert.equal(game.cards.length, 4);
		a.actions.check();
		b.actions.check();
		//River
		assert.equal(game.cards.length, 5);
		a.actions.check();
		b.actions.check();

		assert.equal(game.pot, 8);
		var winner = 14;
		var looser = 6;

		if(a.stackAmount > b.stackAmount){
			assert.equal(a.stackAmount, winner);
			assert.equal(b.stackAmount, looser);
		}else{
			assert.equal(b.stackAmount, winner);
			assert.equal(a.stackAmount, looser);
		}
	});

	it("Doit faire gagner le dernier restant si tous le monde se couche avant la river", function(){
		var a = new Player("Alfred", 10);
		var b = new Player("Bernard", 10);
		var c = new Player("Chris", 10);

		var game = new Game([a, b, c], 0);
		game.start();

		//Pre-Flop
		c.actions.fold();
		a.actions.call();
		b.actions.check();
		//Flop
		assert.equal(game.cards.length, 3);
		assert.equal(game.pot, 4);
		
		a.actions.fold();

		assert.equal(b.stackAmount, 12);
	});
});