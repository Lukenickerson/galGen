RocketBoots.loadComponents([
	"Game",
	"Coords",
	"StateMachine",
	"Dice",
	"Entity",
	"Loop",
	"Stage",
	"World",
	"Keyboard"
]).ready(function(){

	const GALAXY_SIZE_X = 1000,
		GALAXY_SIZE_Y = 800,
		GALAXY_HALF_SIZE_X = GALAXY_SIZE_X/2,
		GALAXY_HALF_SIZE_Y = GALAXY_SIZE_Y/2,
		MAX_PLANETS = 8;
	const MAX_HEAT_LEVEL = 700; // 7 Classes * 10 numerals * 10 fractions
	const MAX_RADIUS = 1.5;
	const MAX_LUMINOSITY_LEVEL = 9;

	const SYLLABLES = [
		'a', 'agg',	'atta',	'akk',
		'bah', 'boo',
		'coru',	'cron',	'corell', 'cu',
		'dago',	'do',
		'er', 'ej',
		'fra',
		'ga',
		'hun', 'ho',
		'ian', 'ill', 'iter',
		'jar', 'jup',
		'ko',
		'lu', 'lo',
		'ma', 'mer',
		'na', 'ne',	'nep', 'nil', 'nt',
		'ool', 'ol', 'org', 
		'po', 'plu',
		'qua',
		'ra', 'ry',	'rel', 'rg',
		'sat', 'sun', 'sca',
		'ta', 'to',	'th', 'tu',	'ter',
		'ul', 'urn', 'us',
		'ven', 'vu', 'vel',
		'win',
		'xen', 'xo',
		'yo',
		'za', 'zo'
	];

	var g = window.g = new RocketBoots.Game({
		name: "galGen",
		instantiateComponents: [
			{"state": "StateMachine"},
			{"loop": "Loop"},
			{"dice": "Dice"},
			{"world": "World"},
			{"stage": "Stage"},
			{"keyboard": "Keyboard"}
		],
		version: "alpha-v0.0.0"
	});

	var systems = g.systems = [];
	var $marker = null;
	var $line = null;
	var $info = null;

	g.dice.switchToPseudoRandom();

	setupWorld();
	setupStage();
	setupDOM();
	setupEvents();
	setupLoops();
	generateSystems();
	start();
	drawAll();

	return g;

	// Hoisted functions

	function drawAll() {
		g.stage.draw();
	}

	function setupWorld() {
		const NEG_GALAXY_HALF_SIZE_X = GALAXY_HALF_SIZE_X * -1;
		const NEG_GALAXY_HALF_SIZE_Y = GALAXY_HALF_SIZE_Y * -1;
		g.world.name = "Galaxy";
		g.world.isBounded = true;
		g.world.setSizeRange(
			{x: NEG_GALAXY_HALF_SIZE_X, y: NEG_GALAXY_HALF_SIZE_Y}, // min
			{x: GALAXY_HALF_SIZE_X, y: GALAXY_HALF_SIZE_Y}, // max
		);
		g.world.addEntityGroups(["galaxies", "systems"]);

		//g.world.putIn(g.planet, ["planets", "physics", "physical"]);
		//g.world.putIn(g.moon, ["planets", "physics", "physical"]);
		//g.world.putIn(g.bot, ["bot", "physics", "physical"]);

		g.stage.resize();

	}

	function setupStage() {
		let layer = g.stage.addLayer("galaxy");
		//g.stage.camera.set({x: 0, y: PLANET_RADIUS/2}).focus();
		//g.stage.camera.follow(g.bot);
		g.stage.resize();
		g.layer = g.stage.layers[0]; // Only going to use one layer

		// Connect all world entities to the layer
		layer.connectEntities(g.world.entities.all);
	}

	function setupDOM() {
		$marker = $('.system-marker').first().hide();
		$line = $('.system-connector').first().hide();
		$info = $('.system-info').first().hide();
	}

	function setupEvents() {
		const $window = $(window);
		const WHEEL_SCALE = -250;
		const MAX_ZOOM_PROPORTION = 2;
		const MIN_ZOOM_PROPORTION = 0.1;
		$window.on('wheel', function(e){
			let scale = (e.originalEvent.deltaY / WHEEL_SCALE);
			let proportion = 1 + scale;
			proportion = Math.min(MAX_ZOOM_PROPORTION, proportion);
			proportion = Math.max(MIN_ZOOM_PROPORTION, proportion);
			zoomSystem(proportion);
		});

		let isDown = false;
		let didMove = false;
		let downPos = new RocketBoots.Coords();
		let $layer = $(g.layer.element);
		let $stage = $(g.stage.element);
		$layer.on('mousedown touchstart', function(e){
			isDown = true;
			didMove = false;
			downPos.set({x: e.pageX, y: e.pageY});
			$layer.addClass("moving");
		}).on('mousemove touchmove', function(e){
			if (isDown) {
				let newPos = new RocketBoots.Coords(e.pageX, e.pageY);
				let delta = downPos.subtract(newPos);
				delta.y = delta.y * -1;
				g.stage.camera.move(delta);
				downPos.set(newPos);
				if (!didMove) {
					$marker.hide();
					$line.hide();
					$info.hide();
					didMove = true;
				}
			}
		}).on('mouseup touchend', function(e){
			isDown = false;
			downPos.clear();
			$layer.removeClass("moving");
		}).on('click touch', function(e){
			if (!didMove) {
				let pos = g.stage.getPosition(e.offsetX, e.offsetY);
				clickStage(pos, e);
			}
			didMove = false;
		});

		$info.on('mousedown', function(e){ $info.addClass("moving"); })
			.on('mouseup', function(e){ $info.removeClass("moving"); });
		//g.stage.addClickEvent(clickStage);
	}

	function setupLoops() {
		g.loop.set(drawAll, 10)
			//.addAction(renderDisplay, RENDER_DELAY)
			//.addAction(botAction, ACTION_DELAY)
			//.addAction(buildingProcessing, BUILDING_PROCESS_DELAY)
		;
	}

	function start() {
		g.loop.start();
	}

////////////////////

	function clickStage(pos, e) {
		let system = findNearestSystem(pos);
		let stagePos = g.stage.getStageCoords(system.pos);
		let x, y;
		setMarker(stagePos);

		$info.show().html(
			'<h1>' + system.sun.name + '</h1>'
			+ '<dl>'
				+ '<dt>Sun</dt>'
				+ '<dd>' + system.sun.spectralClassification.class 
					+ system.sun.spectralClassification.numeral
					+ system.sun.spectralClassification.luminosityClass
					+ ' (' + system.sun.heatLevel + ')'
				+ '</dd>'
				+ '<dd>' + system.sun.spectralClassification.color + ' ' + system.sun.spectralClassification.luminosityName + '</dd>'
				+ '<dt>Planets</dt>'
				+ '<dd>' + system.planets.length + '</dd>'
				+ '<dt>System</dt>'
				+ '<dd>' +  system.name + ' (' + system.originalPos.x + ', ' + system.originalPos.y + ')'
			+ '</dl>'	
		);
		let buffer = g.stage.size.x/10;
		if (stagePos.x > (g.stage.size.x/2)) { // on right
			x = stagePos.x - $info.outerWidth() - buffer;
			y = (stagePos.y - ($info.outerHeight()/2));
			infoEdgeX = stagePos.x - buffer;
			infoEdgeY = stagePos.y;
		} else { // on left
			x = stagePos.x + buffer;
			y = (stagePos.y - ($info.outerHeight()/2));
			infoEdgeX = stagePos.x + buffer;
			infoEdgeY = stagePos.y;
		}
		$info.css({left: x,	top: y});

		setConnector(stagePos, infoEdgeX, infoEdgeY);
	}

	function setMarker(stagePos) {
		$marker.show().css({
			left: stagePos.x - ($marker.outerWidth()/2), 
			top: stagePos.y - ($marker.outerHeight()/2)
		});
	}

	function setConnector(stagePos, infoEdgeX, infoEdgeY) {
		$line.show();
		$line.attr("x1", stagePos.x);
		$line.attr("y1", stagePos.y);
		$line.attr("x2", infoEdgeX);
		$line.attr("y2", infoEdgeY);
	}

	function findNearestSystem(pos) {
		let closestDistance = Infinity;
		let closestSystem = null;
		_.each(systems, function(system){
			let d = system.pos.getDistance(pos);
			if (d < closestDistance) {
				closestDistance = d;
				closestSystem = system;
			}
		});
		closestSystem.isHightlighted = true;
		return closestSystem;
	}

	function generateSystems() {
		i = 1000;
		while (i-- > 0) {
			let sys = getNewSystem();
			systems.push(sys);
			g.world.putIn(sys, ["systems"]);
		}
		return systems;
	}

	function getNewSystem() {
		let newCoords = false;
		let x, y;
		while (!newCoords) {
			x = getCoord(GALAXY_HALF_SIZE_X);
			y = getCoord(GALAXY_HALF_SIZE_Y);
			let found = _.find(systems, function(o){
				return (o.pos.x === x && o.pos.y === y);
			});	
			newCoords = (typeof found === "undefined");	
			if (!newCoords) { console.log("skip"); }
		}
		let randomizer1 = g.dice.random();
		let randomizer2 = g.dice.random();
		let sun = getRandomSun();
		let radius = getStarRadius(sun.heatLevel, randomizer1);
		let sys = new RocketBoots.Entity({
			name: sun.name + " g" + i,
			number: i,
			size: 			{x: 1, y: 1},
			radius: (0.5 + (MAX_RADIUS * (sun.heatLevel/MAX_HEAT_LEVEL))),
			originalPos: 	{x: x, y: y},
			pos: 			{x: x, y: y},
			sun: 			sun,
			planets: 		[],
			color: 			sun.spectralClassification.drawColor,
			draw: 			"circle"
		});
		sys.planets = getRandomPlanets(sys);
		return sys;

		function getCoord(x) {
			var half = g.dice.random();
			if (half < 0.5) {
				var a = g.dice.random();
				var b = g.dice.random();
				var c = g.dice.random();
				var d = g.dice.random();
				return parseInt(x * (a+b-c-d) * 0.5);
			}
			return parseInt(g.dice.getRandomAround(x));
		}
	}

	function getHeatLevel() {
		return Math.floor(Math.abs(g.dice.getRandomAround(MAX_HEAT_LEVEL)));
	}

	function getRandomSun() {
		let heatLevel = getHeatLevel();
		let luminosityLevel = g.dice.getRandomIntegerBetween(0, MAX_LUMINOSITY_LEVEL); 
		let sc = getSpectralClassification(heatLevel, luminosityLevel);
		let sun = new RocketBoots.Entity({ // TODO: switch to custom class
			name: getRandomName(),
			radius: 100, // TODO: calculate this
			color: sc.drawColor,
			draw: "circle",
			heatLevel: heatLevel,
			spectralClassification: sc,
		});
		return sun;
	}

	function getRandomPlanets(system) {
		let planets = [];
		let planetNumber = g.dice.getRandomIntegerBetween(1, MAX_PLANETS);
		while (--planetNumber > 0) {
			planets.push(getRandomPlanet(system, planetNumber));
		}
		return planets;
	}

	function getRandomPlanet(system, n) {
		let planet = new RocketBoots.Entity({ // TODO: switch to custom class
			name: system.sun.name + "-" + n,
			radius: 10, // TODO: generate
			pos: {}, // TODO: generate based on orbit radius
			draw: "circle"
		});
		return planet;
	}

	function getRandomName() {
		let syllablesNumber = g.dice.getRandomIntegerBetween(2,4);
		let name = '';
		while (syllablesNumber--) {
			name += g.dice.selectRandom(SYLLABLES);
		}
		name = name.charAt(0).toUpperCase() + name.slice(1);
		return name;
	}

	function getSpectralClassification(heatLevel, luminosityLevel) {
		const LUMINOSITY_CLASSES = [
			{name: "hypergiant", class: "Ia+"},
			{name: "luminous supergiant", class: "Ia"},
			{name: "intermediate luminous superigant", class: "Iab"},
			{name: "less luminous supergiant", class: "Ib"},
			{name: "bright giant", class: "II"},
			{name: "normal giant", class: "III"},
			{name: "subgiant", class: "IV"},
			{name: "dwarf (main-sequence star)", class: "V"},
			{name: "subdwarf", class: "sd"},
			{name: "white dwarf", class: "D"}
		];
		const TEMP_CLASSES = [
			{
				class: "O",
				color: "blue",
				rgb: [100,100,255]
			},{
				class: "B",
				color: "blue white",
				rgb: [150,200,255]
			},{
				class: "A",
				color: "white",
				rgb: [255,255,255]
			},{
				class: "F",
				color: "yellow white",
				rgb: [255,255,100]
			},{
				class: "G",
				color: "yellow",
				rgb: [255,255,100]
			},{
				class: "K",
				color: "orange",
				rgb: [255,200,100]
			},{
				class: "M",
				color: "red",
				rgb: [255,100,100]
			}
		];
		let i = 6 - Math.floor(heatLevel / 100); /* 10 * 10 */
		let sc = TEMP_CLASSES[i];
		let lc = LUMINOSITY_CLASSES[luminosityLevel];
		sc.drawColor = "rgb(" + sc.rgb[0] + "," + sc.rgb[1] + "," + sc.rgb[2] + ")";
		sc.numeral = Math.floor(heatLevel / 7) / 10;
		sc.luminosityClass = lc.class;
		sc.luminosityName = lc.name;
		return sc;
	}

	function getStarRadius(heatLevel, rand) {
		// TODO:
	}

	function zoomSystem(amount) {
		g.stage.camera.pos.multiply(amount);
		_.each(systems, function(sys){
			sys.pos.multiply(amount);
		});
	}





}).init();


