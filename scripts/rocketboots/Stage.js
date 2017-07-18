(function(){
	var component = {
		fileName: 		"Stage",
		classNames:		["Stage"],
		requirements:	["Coords"], // Works with the Entity component
		description:	"",
		credits:		"By Luke Nickerson, 2014, 2016"
	};
	
	function Stage (options) {
		options = options || {};
		this.init(options);
	}
	component.Stage = Stage;

/// Initialize Stage

	Stage.prototype.init = function(options){
		if (typeof options === 'string') {
			options = {elementId: options};
		}
		options = $.extend({
			elementId: 		"stage",
			size: 			{x: 100, y: 100},
			scale: 			{x: 1, y: 1},
			smoothImage: 	false,
			layers: 		[],
			layerCount: 	0,
			layerOngoingCounter: 0,
			scales: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.2, 1.5, 2, 3, 5, 8, 13, 21, 34],
			scaleIndex: 8,
			pixelScale: 1
		}, options);

		//console.log("Stage: Creating stage with options:", options);

		$.extend(this, options);

		this.size 		= new RocketBoots.Coords(this.size);
		this.scale 		= new RocketBoots.Coords(this.scale);
		this._halfSize 	= this.size.getCopy().multiply(0.5);
		this.element = document.getElementById(this.elementId);
		this.camera = new this.Camera({stage: this});
		this.connectedEntity = null;
	}

/// Layer Controls

	Stage.prototype.addLayer = function(layerName){
		if (typeof layerName == 'undefined') { layerName = "canvas"; }
		this.layerOngoingCounter++;
		var layer = new this.Layer({ layerName: layerName, stage: this});
		//console.log(layer);
		this.element.appendChild(layer.element);
		this.layers.push(layer);
		this.layerCount++;
		return layer;
	};
	Stage.prototype.addLayers = function(layerNames){
		var s = this;
		var layers = [];
		layerNames.forEach(function(layerName){
			layers.push( s.addLayer(layerName) );
		});
		return layers;
	};
	Stage.prototype.removeLayer = function(){
		// FIXME: This doesn't work
		this.layerCount--;
	};

	Stage.prototype.loopOverLayers = function(fn){
		for (var i = 0; i < this.layerCount; i++){
			fn(this.layers[i], i);
		}		
	};

	Stage.prototype.getLayerNames = function() {
		var names = [];
		this.loopOverLayers(function(layer){
			names.push(layer.name);
		});
		return names;
	};

/// Draw and Resize

	Stage.prototype.draw = function(forceAll){
		if (typeof forceAll != "boolean") { forceAll = false; }
		this.camera.focus();
		this.loopOverLayers(function drawLayer (layer, i){
			if (layer.drawWithStage || forceAll) {
				//console.log("Stage: Drawing Layer", i);
				layer.draw();
			}
		});
	}
	Stage.prototype.resize = function(size){
		var o = this;
		if (typeof size == 'undefined') {
			var $elt = $(this.element);
			size = {
				x : $elt.width()
				,y : $elt.height()
			};
		}
		console.log("Stage: Resize stage to", size, "with scaling", o.scale);
		o.size.x = size.x;
		o.size.y = size.y;
		o._halfSize = { x: size.x/2, y: size.y/2 };
		o.element.style.width		= (size.x * o.scale.x * o.pixelScale) + "px";
		o.element.style.height		= (size.y * o.scale.y * o.pixelScale) + "px";
		o.loopOverLayers(function(layer){
			layer.resize(size);
		});
		return o.draw();
	};

/// Zoom

	Stage.prototype.zoomIn = function () {
		this.scaleIndex = Math.min((this.scales.length - 1), (this.scaleIndex + 1));
		return this.setScaleToZoom();
	};
	Stage.prototype.zoomOut = function () {
		this.scaleIndex = Math.max(0, (this.scaleIndex - 1));
		return this.setScaleToZoom();
	};
	Stage.prototype.setScaleToZoom = function () {
		var n = this.scales[this.scaleIndex];
		this.scale.set({x: n, y: n});
		return this.scale;
	};

/// Coordinates

	Stage.prototype.getStageCoords = function(pos){
		if (this.camera.rotation !== 0) {
			var x = pos.x, y = pos.y;
			pos = new RocketBoots.Coords(pos);
			pos.rotate(this.camera.rotation, this.camera.pos);
		}
		return (new RocketBoots.Coords(this._getStageX(pos.x), this._getStageY(pos.y)));
	};

	// NOTE: `getStageX` and `getStageY` do NOT use the camera's rotation
	Stage.prototype._getStageX = function (x) {
		return parseInt(((x - this.camera.pos.x) + this._halfSize.x) * this.scale.x);
	};
	Stage.prototype._getStageY = function (y) {
		return parseInt((this._halfSize.y - y + this.camera.pos.y) * this.scale.y);
	};

	// FIXME: `getPosition` does not use scale or camera's rotation!
	Stage.prototype.getPositionFromStageCoords = function(stageXY){
		var pos = new RocketBoots.Coords(
			(stageXY.x + this.camera.pos.x - this._halfSize.x),
			(this.camera.pos.y + this._halfSize.y - stageXY.y)
		);
		if (this.camera.rotation !== 0) {
			pos.rotate(-this.camera.rotation, this.camera.pos);
		}
		return pos;
	};
	Stage.prototype.getPosition = function(stageX, stageY){
		return this.getPositionFromStageCoords({x: stageX, y: stageY});
	};

	Stage.prototype.getPositionFromEventPageCoords = function (eventPageXY) {
		var stageRect = this.element.getBoundingClientRect();
		var stageXY = {
			x: (eventPageXY.x - stageRect.left),
			y: (eventPageXY.y - stageRect.top)
		};
		return this.getPositionFromStageCoords(stageXY);
	};

	Stage.prototype.getStageRotation = function(rot){
		return (rot - this.camera.rotation);
	};

/// Stage Clicking and Connections

	Stage.prototype.addClickEvent = function(fn){
		var s = this;
		$(this.element).click(function(e){
			//console.log("Clicked stage", e.offsetX, e.offsetY);
			fn(s.getPosition(e.offsetX, e.offsetY), e);
		});
	};
	Stage.prototype.connectToEntity = function(world){
		console.log("Connecting stage", this, "to world", world);
		this.loopOverLayers(function(layer){
			//world.addEntityGroup(layer.name);
			var ents = world.getEntitiesByGroup(layer.name);
			if (ents) {
				layer.connectEntities(ents);
			}
		});
		this.connectedEntity = world;
	};
	Stage.prototype.disconnect = function(){
		this.loopOverLayers(function(i, layer){
			layer.disconnectEntities();
		});
		this.connectedEntity = null;
	};

	
//==== CAMERA

	Stage.prototype.Camera = function(options){
		_.extend(this, {
			pos: {x: 0, y: 0},
			rotation: 0,
			followCoords: null,
			lockedX: null,
			lockedY: null,
			stage: null,
			boundaries: null
		}, options);
		this.pos = new RocketBoots.Coords(this.pos);
	};
	Stage.prototype.Camera.prototype.set = function(coords){
		this.pos.set(coords);
		this.focus();
		return this;
	};
	Stage.prototype.Camera.prototype.move = function(coords){
		this.pos.add(coords);
		this.focus();
		return this;
	};
	Stage.prototype.Camera.prototype.follow = function(coords){
		if (coords instanceof RocketBoots.Coords) {
			this.followCoords = coords;
			this.focus();
		} else if (typeof coords === 'object' && coords.pos instanceof RocketBoots.Coords) {
			return this.follow(coords.pos);
		} else {
			console.warn('Could not follow bad coordinates: ', coords);
		}
		return this;
	};
	Stage.prototype.Camera.prototype.unfollow = function(){
		this.followCoords = null;
		return this;
	};
	Stage.prototype.Camera.prototype.stop = function(){
		this.focus();
		this.followCoords = null;
		this.unlock();
		return this;
	};
	Stage.prototype.Camera.prototype.lockX = function (x) {
		this.lockedX = x;
		return this;
	};
	Stage.prototype.Camera.prototype.lockY = function (y) {
		this.lockedY = y;
		return this;
	};	
	Stage.prototype.Camera.prototype.unlock = function () {
		this.lockedX = null;
		this.lockedY = null;
		return this;
	};
	Stage.prototype.Camera.prototype.focus = function(coords){
		if (this.followCoords != null) {
			this.pos.x = (typeof this.lockedX === 'number') ? this.lockedX : this.followCoords.x;
			this.pos.y = (typeof this.lockedY === 'number') ? this.lockedY : this.followCoords.y;
		} else if (this.boundaries != null) {
			//this.pos.x = this.boundaries[1].x - this.boundaries[0].x;
			//this.pos.y = this.boundaries[1].y - this.boundaries[0].y;
		}
		this.keepInBounds();
		return this;
	};
	Stage.prototype.Camera.prototype.setBoundaries = function(coordsLow, coordsHigh) {
		if (typeof coordsHigh === 'undefined') {
			coordsHigh = coordsLow;
			coordsLow = new RocketBoots.Coords(0,0);
		}
		this.boundaries = { min: coordsLow, max: coordsHigh };
		return this;
	};
	Stage.prototype.Camera.prototype.setBoundariesToWorld = function(world){
		return this.setBoundaries(world.size);
	};
	Stage.prototype.Camera.prototype.keepInBounds = function(){
		if (this.boundaries !== null) {
			this.pos.x = Math.max(Math.min(this.boundaries.max.x, this.pos.x), this.boundaries.min.x);
			this.pos.y = Math.max(Math.min(this.boundaries.max.y, this.pos.y), this.boundaries.min.y);
		}
	};
	


	//==== LAYER
	Stage.prototype.Layer = function(options){
		this.init(options);
	};

	Stage.prototype.Layer.prototype.init = function (options) {
		this.tagName 		= options.tagName || "canvas";
		this.name 			= options.layerName || "Layer";
		this.stage 			= options.stage;
		this.element 		= document.createElement(this.tagName);
		this.elementId 		= this.stage.elementId + "-" + this.stage.layerOngoingCounter;
		// Set some values for the newly created layer element
		this.element.id 		= this.elementId;
		this.element.className 	= "layer";
		this.drawWithStage 		= true;
		this.smoothImage 		= this.stage.smoothImage;
		this.size 				= this.stage.size;
		this.scale 				= this.stage.scale;
		this.ctx = (this.tagName === 'canvas') ? this.element.getContext('2d') : null;
		this.entitiesArray = [];
		// Set these to non-zero to draw grid lines
		this.stageGridScale = 0; 
		this.worldGridScale = 0;
		this.world = null;
		this.getEntitiesArray;
		this._TWO_PI = Math.PI * 2;
		// TODO: Make sure that this layer has position: absolute/relative
		this.resize();
		return this;
	};
	
	Stage.prototype.Layer.prototype.resize = function(size) {
		var o = this;
		if (typeof size == 'undefined') {
			var $elt = $(this.element);
			size = {
				x : $elt.width()
				,y : $elt.height()
			};
		}
		o.size.x = size.x;
		o.size.y = size.y;
		o.element.style.width	= (size.x * o.stage.scale.x * o.stage.pixelScale) + "px";
		o.element.style.height	= (size.y * o.stage.scale.y * o.stage.pixelScale) + "px";
		o.element.width			= size.x;
		o.element.height		= size.y;
		o.element.style.position = "absolute";
		o.element.style.top 	= "0";
		o.element.style.left 	= "0";

		if (!o.smoothImage) {
			o.element.style.imageRendering = "pixelated";
			// TODO: work for other browsers?
			// -ms-interpolation-mode: nearest-neighbor; // IE 7+ (non-standard property)
			// image-rendering: -webkit-optimize-contrast; // Safari 6, UC Browser 9.9
			// image-rendering: -webkit-crisp-edges; // Safari 7+ 
			// image-rendering: -moz-crisp-edges; // Firefox 3.6+ 
			// image-rendering: -o-crisp-edges; // Opera 12 
			// image-rendering: pixelated; // Chrome 41+ and Opera 26+
		}
		o.ctx.scale(o.scale.x, o.scale.y);
		return this;
	};

	Stage.prototype.Layer.prototype._getEntitiesArray = function() {
		if (typeof this.getEntitiesArray === 'function') {
			return this.getEntitiesArray();
		} else {
			return this.entitiesArray;
		}
	};

	Stage.prototype.Layer.prototype.connectEntities = function(ents) {
		this.entitiesArray = ents;
	};
	Stage.prototype.Layer.prototype.disconnectEntities = function(ents) {
		this.entitiesArray = [];
	};

	Stage.prototype.Layer.prototype.addEntities = function(ents) {
		var lay = this;
		//this.entitiesArray.concat(ents);
		if (ents instanceof Array) {
			$.each(ents, function(i, ent){
				lay.entitiesArray.push(ents);
			});
		} else if (typeof ents === "object") {
			lay.entitiesArray.push(ents);
		} else {
			console.error("Incorrect entities. Cannot connect to layer.", ents);
		}
		return this;
	};

	Stage.prototype.Layer.prototype.clear = function() {
		this.ctx.clearRect(0, 0, this.size.x, this.size.y);
		return this;
	};

	Stage.prototype.Layer.prototype.draw = function(clearFirst) {
		var o = this,
			ctx = o.ctx,
			entCount = 0,
			ents = o._getEntitiesArray(),
			ent = {},
			i, j, z,
			zIndices = [];
		if (typeof clearFirst === 'undefined') { clearFirst = true; }
		
		if (clearFirst) {
			o.clear();
		}
		
		// ctx.translate(0.5, 0.5); // TODO: Does this fix the half pixel issue?
		ctx.save();
		ctx.fillStyle = '#ffff66';
		ctx.strokeStyle = '#000000';
		
		//ctx.scale(2, 2);

		// Loop over entities and draw them
		i = ents.length;
		//console.log("Stage: Drawing layer", this.name, "with", entCount, "entities.");
		while (i--) {
			ent = ents[i];
			if (ent !== null) {
				// If the entity has a z-index, then keep track of it to draw later
				if (ent.layerZIndex) {
					if (!(zIndices[ent.layerZIndex] instanceof Array)) {
						zIndices[ent.layerZIndex] = [];
					}
					zIndices[ent.layerZIndex].push(ent);
				} else {
					//console.log(ent);
					o.drawEntity(ent);
				}
			}
			/*
			entCount = ents.length;
			for (j = 0; j < entCount; j++){
				ent = ents[j];
				if (ent != null) this.drawEntity(ent);
			}
			*/
		}
		// Loop over z-indices to see if any entities need to be drawn after (on top)
		for (z = 0; z < zIndices.length; z++) {
			if (zIndices[z] instanceof Array) {
				i = zIndices[z].length;
				while (i--) {
					o.drawEntity(zIndices[z][i]);
				}
			}
		}


		// Draw a grid
		o.drawGrids();
		ctx.restore();
		return i;
	};

	Stage.prototype.Layer.prototype.drawEntity = function(ent) {
		if (!ent.isVisible) {
			return false;
		}
		var ctx = this.ctx;
		var layerSize = this.size;
		// Find the middle of the entity
		var entStageCoords = this.stage.getStageCoords(ent.pos); 
		var entStageRotation = this.stage.getStageRotation(ent.rotation);
		// Find the top/left stage coordinates of the entity
		var entStageCoordsOffset = new RocketBoots.Coords(
			entStageCoords.x - ent._halfSize.x + ent.stageOffset.x,
			entStageCoords.y - ent._halfSize.y + ent.stageOffset.y
		);
		// How big is the stage?
		var entStageSize = {
			x: ent.size.x * this.stage.scale.x,
			y: ent.size.y * this.stage.scale.y
		};

		// Note: The off-stage calculations don't take rotation into consideration
		// TODO: ^ Fix this
		if (!ent.drawOffstage) {
			if (entStageCoordsOffset.x > layerSize.x || (entStageCoordsOffset.x + entStageSize.x) < 0) {
				return false; // off stage (layer), right or left
			} else if (entStageCoordsOffset.y > layerSize.y || (entStageCoordsOffset.y + entStageSize.y) < 0) {
				return false; // off stage (layer), top or bottom
			}
		}

		// ctx.layer = this; // TODO: Is this needed?
		
		ctx.save(); // TODO: needed here or does the save/restore in `draw` suffice?

		//if (ent.rotation !== 0) {
			// Method 1
			ctx.translate(entStageCoords.x, entStageCoords.y);
			ctx.rotate(entStageRotation);
			ctx.translate(-entStageCoords.x, -entStageCoords.y);

			// Method 2
			// TODO: This might be faster, but doesn't work the same as above
			// see http://stackoverflow.com/a/42780731/1766230
			// var xdx = Math.cos(ent.rotation);
			// var xdy = Math.sin(ent.rotation);
			// ctx.setTransform(
			// 	xdx, xdy,  				// direction of the x-axis
			// 	-xdy, xdx, 				// direction of the y axis (90 clockwise from x axis)
			// 	entStageCoords.x, entStageCoords.y 	// set the origin point around which to rotate
			// );
		//}
		
		

		if (typeof ent.draw === 'object') {			// OLD METHOD
			if (typeof ent.draw.before === 'function') {
				ent.draw.before(ctx, entStageCoords, entStageCoordsOffset, this, ent, entStageSize);
			}

			if (typeof ent.draw.custom === 'function') {
				ent.draw.custom(ctx, entStageCoords, entStageCoordsOffset, this, ent, entStageSize);	
			} else {
				if (ent.image) {
					ctx.drawImage( ent.image,
						entStageCoordsOffset.x, entStageCoordsOffset.y,
						entStageSize.x, entStageSize.y);
				} else {
					ctx.fillStyle = ent.color;
					ctx.fillRect(entStageCoordsOffset.x, entStageCoordsOffset.y, 
						entStageSize.x, entStageSize.y);	
				}
			}
			
			if (ent.isHighlighted) {
				if (typeof ent.draw.highlight == 'function') {
					ent.draw.highlight();
				} else {
					//ctx.strokeStyle = '#ff0000';
					ctx.strokeRect(entStageCoordsOffset.x, entStageCoordsOffset.y, ent.size.x, ent.size.y);
				}
			}

			if (typeof ent.draw.after === 'function') {
				ent.draw.after(ctx, entStageCoords, entStageCoordsOffset, this, ent, entStageSize);
			}
		} else if (typeof ent.draw === 'function') { 	// NEW METHOD (half-baked)
			ent.draw(ctx, entStageCoords, entStageCoordsOffset, entStageSize, this, ent);
		} else if (ent.image) {
			ctx.drawImage( ent.image,
				entStageCoordsOffset.x, entStageCoordsOffset.y,
				entStageSize.x, entStageSize.y);			
		} else if (ent.draw === 'rectangle') {
			ctx.fillStyle = ent.color;
			ctx.fillRect(entStageCoordsOffset.x, entStageCoordsOffset.y, 
				entStageSize.x, entStageSize.y);
		} else if (ent.draw === 'circle') {
			ctx.beginPath();
			ctx.fillStyle = ent.color;
			ctx.arc(entStageCoords.x, entStageCoords.y, ent.radius, 0, this._TWO_PI);
			ctx.closePath();
			ctx.fill();			
		}
	
		/*
		ctx.strokeStyle = ent.color;
		ctx.beginPath();
		ctx.arc(entStageCoords.x, entStageCoords.y, ent.radius, 0, PI2);
		ctx.stroke();	
		*/
		
		ctx.restore(); // CAREFUL: Only needed if `save` is used above
	};

	Stage.prototype.Layer.prototype.drawStageLine = function (x1, y1, x2, y2, lineWidth, color) {
		var ctx = this.ctx;
		if (lineWidth) { ctx.lineWidth = lineWidth; }
		if (color) { ctx.strokeStyle = color; }
		if (lineWidth == 1) {
			y1 += 0.5;
			y2 += 0.5;
		}
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();

		//console.log(arguments);
		return this;
	}

	Stage.prototype.Layer.prototype.drawGrids = function() {
		if (this.stageGridScale > 0) {
			this.drawStageGrid(this.stageGridScale);
		}
		if (this.worldGridScale > 0) {
			this.drawWorldGrid(this.worldGridScale);
		}
	};

	Stage.prototype.Layer.prototype.drawStageGrid = function(scale){
		var lay = this,
			ctx = this.ctx;
		//==== Stage Grid
		ctx.strokeStyle = 'rgba(255,255,0,0.25)'; //#ffff00';
		ctx.beginPath();
		for (i = 0; i < lay.size.x; i+=lay.stageGridScale) {
			ctx.moveTo(i, 0);
			ctx.lineTo(i, lay.size.y);
			//ctx.strokeRect(i, 0, i, lay.size.y);
		}
		for (i = 0; i < lay.size.y; i+=lay.stageGridScale) {
			ctx.moveTo(0, i);
			ctx.lineTo(lay.size.x, i);
			//ctx.strokeRect(0, i, lay.size.x, i);
		}
		ctx.lineWidth = 1;
		ctx.stroke();
	};

	Stage.prototype.Layer.prototype.drawWorldGrid = function(scale){
		var stage = this.stage,
			world = stage.connectedEntity,
			ctx = this.ctx,
			min, max, x, y, drawLine;

		if (typeof this.stage.connectedEntity.size === 'object') {				
			// *** TODO: FIXME: Fix so it doesn't draw on half pixels 
			// http://stackoverflow.com/questions/13879322/drawing-a-1px-thick-line-in-canvas-creates-a-2px-thick-line

			drawLine = function (coordStart, coordEnd) {
				var lineStart = stage.getStageCoords(coordStart);
				var lineEnd = stage.getStageCoords(coordEnd);
				ctx.moveTo(lineStart.x, lineStart.y);
				ctx.lineTo(lineEnd.x, lineEnd.y);
			}

			// Draw grid
			ctx.strokeStyle = 'rgba(10,100,255,0.3)';
			ctx.beginPath();
			for (x = world.min.x; x <= world.max.x; x += scale) {
				drawLine({x: x, y: world.min.y}, {x: x, y: world.max.y});
			}
			for (y = world.min.y; y <= world.max.y; y += scale) {
				drawLine({x: world.min.x, y: y}, {x: world.max.x, y: y});
			}
			ctx.lineWidth = 1;
			ctx.closePath();
			ctx.stroke();

			// Draw x=0 and y=0 lines
			ctx.strokeStyle = 'rgba(0,100,255,0.7)';
			ctx.beginPath();
			// FIXME: y-axis not displaying correctly
			drawLine({x: 0, y: world.min.y}, {x: 0, y: world.max.y});
			drawLine({x: world.min.x, y: 0}, {x: world.max.x, y: 0});
			ctx.lineWidth = 1;
			ctx.closePath();
			ctx.stroke();

		} else {
			console.warn("Cannot draw world grid. Please connect an entity to the stage, or turn off grid drawing by setting the layer's worldGridScale to 0.");
			return false;
		}
	};



	// Install into RocketBoots if it exists
	if (typeof RocketBoots === "object") {
		RocketBoots.installComponent(component);
	} else { // Otherwise put the classes on the global window object
		for (var i = 0; i < component.classNames.length; i++) {
			window[component.classNames[i]] = component[component.classNames[i]];
		}
	}
})();