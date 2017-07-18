(function(){
	var component = {
		fileName: 		"Physics",
		classNames:		["Physics"],
		requirements:	[], // Dependent on Entity-like objects, but not a strict requirement
		description:	"Physics class",
		credits:		"By Luke Nickerson, 2014, 2017, originally from stardust.js"
	};

	var Physics = component.Physics = function(){
		this.isCollisionDetectionOn = true;
		this.isObjectGravityOn = false;
		//this.isLinearGravityOn = true;
		this.elasticity = 0.7;
		this.gravitationalConstant = 0.5; // "big G"
	}
	Physics.prototype.apply = function(world){
		var p = this;
		// Loop over all movable entities
		world.loopOverEntities("physics", function physicsLoop (entity1Index, ent1){	
			// Do gravity between objects
			if (p.isObjectGravityOn) {
				world.loopOverEntities("physics", function physicsGravityLoop (entity2Index, ent2){
					p.applyGravityForce(ent1, ent2);
				});
			}
			// Process all newtonian motions
			if (ent1.isImmovable) {
				ent1.vel.clear();
			} else if (ent1.mass > 0) {
				let forceAcc;
				// Standard newtonian physics...
				ent1.force.add(ent1.impulse);
				forceAcc = new RocketBoots.Coords((ent1.force.x / ent1.mass), (ent1.force.y / ent1.mass));
				ent1.acc.add(forceAcc);
				ent1.vel.add(ent1.acc);
				ent1.pos.add(ent1.vel);
			}
			// Acceleration, force, and impulse are momentary forces as currently coded
			ent1.acc.clear();
			ent1.force.clear();
			ent1.impulse.clear();
			// Stop objects from flying out of the world
			if (world.isBounded) {
				world.keepCoordsInBounds(ent1.pos);
			}
		});			

		if (p.isCollisionDetectionOn) {
			world.loopOverEntities("physical", function collisionLoop1 (entity2Index, ent1){
				world.loopOverEntities("physical", function collisionLoop2 (entity2Index, ent2){
					var r = ent1.pos.getDistance(ent2.pos);
					if (p.isCollisionDetectionOn) {
						if (r == 0) {
							// Don't do anything (Black hole or ent2 is the same as ent1)
						} else {
							let edgeToEdgeDist = r - ent1.radius - ent2.radius;
							if (edgeToEdgeDist <= 0) {
								//console.log("hit");
								
								let pushBack = edgeToEdgeDist / 1; //(edgeToEdgeDist / 1);
								if (ent1.mass <= ent2.mass) {
									ent1.pos.add( ent1.pos.getUnitVector(ent2.pos).multiply(pushBack) );
								} else {
									ent2.pos.add( ent2.pos.getUnitVector(ent1.pos).multiply(pushBack) );           
								}
								
								p.setNewCollisionVels(ent1, ent2, p.elasticity);
							}
						}
					}
				});
				if (world.isBounded) {
					world.keepCoordsInBounds(ent1.pos);
				}
			});
		}
	};

	Physics.prototype.applyGravityForce = function (o1, o2) {
		var r, rv, Gmm, rSquared, n;
		// Apply gravity forces: F = G (m1 m2) / r^2
		// http://en.wikipedia.org/wiki/Newton's_law_of_universal_gravitation#Vector_form
		//console.log("Forces on", o1.name, " due to ", o2.name);
		r = o1.pos.getDistance(o2.pos);
		rv = o1.pos.getUnitVector(o2.pos);
		//console.log("unit vector", JSON.stringify(rv));
		
		Gmm = this.gravitationalConstant * o1.mass * o2.mass;
		rSquared = Math.pow(r, 2);
		n = (rSquared == 0) ? 0 : (Gmm/rSquared);
		rv.multiply(n);
		//console.log(JSON.stringify(rv));
		o1.force.add(rv);
		//console.log("physics", i, b, o1.bigG, o1.mass, o2.mass);
	}
	

	Physics.prototype.setNewCollisionVels = function(o1, o2, elasticity){
		// http://www.gamasutra.com/view/feature/131424/pool_hall_lessons_fast_accurate_.php?page=3
		if (o1.mass <= 0 || o2.mass <= 0) {
			return false;
		}
		//console.log(o1.name, o2.name);
		//console.log("original", o1.vel.x, o1.vel.y, o2.vel.x, o2.vel.y);
		//console.log("momentum before", (o1.mass * o1.vel.getMagnitude()) + (o2.mass * o2.vel.getMagnitude()));
		var p = (o1.mass * o1.vel.getMagnitude()) + (o2.mass * o2.vel.getMagnitude());
		var n = o1.pos.getUnitVector(o2.pos);
		//console.log("n = ", n);
		var a1 = o1.vel.getDot(n);
		var a2 = o2.vel.getDot(n);
		var optimizedP = (2 * (a1 - a2)) / (o1.mass + o2.mass);
		if (!o1.isImmovable) {
			o1.vel.add( n.getMultiply(-1 * optimizedP * o2.mass) );
			o1.vel.multiply(elasticity);
		}
		if (!o2.isImmovable) {
			o2.vel.add( n.getMultiply(optimizedP * o1.mass) );
			o2.vel.multiply(elasticity);
		}
		//var pNew = (o1.mass * o1.vel.getMagnitude()) + (o2.mass * o2.vel.getMagnitude());
		//console.log(pNew - p);
		//if (pNew > p) {
			 //console.log(o1.name, o2.name, "pNew > p", pNew, p);
		//}else console.log(o1.name, o2.name, "pNew <= p", pNew, p);
		//console.log("after", newV1.x, newV1.y, newV2.x, newV2.y);
		//console.log("momentum after", (o1.mass * o1.vel.getMagnitude()) + (o2.mass * o2.vel.getMagnitude()));
		return true;
	}


	// Install into RocketBoots if it exists
	if (typeof RocketBoots === "object") {
		RocketBoots.installComponent(component);
	} else { // Otherwise put the classes on the global window object
		for (var i = 0; i < component.classNames.length; i++) {
			window[component.classNames[i]] = component[component.classNames[i]];
		}
	}
})();