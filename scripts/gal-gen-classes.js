(function(){

function classConstructor(thing, options, nonEntityProperties, entityReferences) {
	if (!options) { options = {}; }
	if (!nonEntityProperties) { nonEntityProperties = []; }
	if (!entityReferences) { entityReferences = []; }
	// Properties only in this class, and not for the entity
	nonEntityProperties.forEach(function(prop){
		thing[prop] = options[prop];
		delete options[prop];
	});
	// Create the entity
	thing.entity = new RocketBoots.Entity(options);
	// Keep a reference to some entity objects
	entityReferences.forEach(function(prop){
		thing[prop] = thing.entity[prop];
	});
	return thing;
}

class DNA {
	constructor(options) {
		options = options || {};
		this.seed = options.seed || 0;
		this.length = options.length || 1;
		this.strand = [];
	}
	getDNA(n) {
		if (typeof n === "number") {
			return this.strand[n];
		}
		return this.strand;
	}
	build() {
		let dice = new RocketBoots.Dice({type: "pseudorandom", seed: this.seed});
		this.clear();
		for(let i = 0; i < n; i++) {
			this.strand.push(dice.random());
		}
		return this;
	}
	clear() {
		this.strand.splice(0, this.strand.length);
	}
}

class AstroObject {
	constructor(options) {
		options = options || {};
		if (typeof options.seed === "number" && typeof options.dnaLength === "number") {
			this.dna = new DNA({seed: options.seed, dnaLength: options.dnaLength});
			delete options.seed;
			delete options.dnaLength;
		}
	}
}

class Galaxy extends AstroObject {
	constructor(options) {
		super(options, options);
		this.nucleus = new BlackHole; // aka. galactic core
		this.activeGalacticNucleus = null; // Implement later?
		this.type = "Globular cluster";
		// See...
		// https://en.wikipedia.org/wiki/Galaxy#Types_and_morphology
		// https://en.wikipedia.org/wiki/Dwarf_galaxy#Common_types
		this.systems = options.systems;
	}
}

class System extends AstroObject {
	constructor(options) {
		super(options, options);
		classConstructor(this, options, ["sun", "planets", "originalPos"], ["pos"]);
	}
	deconstruct() {
		delete this.planets;
	}
	reconstruct() {
		//this.planets = 
	}
}

class AstroBody extends AstroObject {
	constructor(options) {
		super(options, options);
	}
}

class Planet extends AstroBody {
	constructor(options) {
		super(options, options);
		classConstructor(this, options, ["dna", "system", "moons"], ["pos"]);
	}
}

class Moon extends AstroBody {
	constructor(options) {
		super(options, options);
		classConstructor(this, options, ["dna", "planet"], ["pos"]);
	}
}

class BlackHole extends AstroBody {
	constructor(options) {
		super(options, options);
		classConstructor(this, options, [], ["pos"]);
	}	
}


// Exponse
window.Galaxy = Galaxy;
window.System = System;
window.Planet = Planet;
window.Moon = Moon;
window.BlackHole = BlackHole;

})();