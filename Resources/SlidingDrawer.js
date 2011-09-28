var extend = function(obj) {
    var args = Array.prototype.slice.call(arguments, 1);
    for (var i = 0; i < args.length; i++) {
    	var source = args[i];
      	for (var prop in source) {
        	if (source[prop] !== void 0) obj[prop] = source[prop];
      	}
    }
    return obj;
};

var defaults = {
	position: 'bottom',
	handleSize: 30,
	handleBackgroundGradient: {
		type:'linear',
		colors:[
			'#888888',
			'#333333'
		]
	}
};

var settings = {
	bottom: {
		axis: 'y',
		multiplier: -1,
		dimension: 'height'
	},
	top: {
		axis: 'y',
		multiplier: 1,
		dimension: 'height'
	},
	left: {
		axis: 'x',
		multiplier: 1,
		dimension: 'width'	
	},
	right: {
		axis: 'x',
		multiplier: -1,
		dimension: 'width'	
	}
};

exports.createSlidingDrawer = function(o) {
	o = o || {};
	
	var content = o.contentView;
	var handle = o.handleView;
	var eventHandle = undefined;
	var position = o.position || defaults.position;
	var ps = undefined;
	
	// Make sure we are using a valid position
	if (position !== 'top' && 
		position !== 'bottom' &&
		position !== 'left' && 
		position !== 'right') {
		Ti.API.warn('createSlidingDrawer warning: unknown position type, using \'' + defaults.position + '\' instead...');
		position = defaults.position;	
	}
	ps = settings[position];
	
	if (!handle) {
		// Create a handle view
		handle = Ti.UI.createView({
			borderWidth: 1,
			borderColor: '#000'
		});	
		//handle = extend(handle, ps.handle);
		handle[position] = 0;
		handle[ps.dimension] = o.handleSize || defaults.handleSize;
		handle[ps.dimension === 'width' ? 'height' : 'width'] = '100%';
		
		// Handle background styling for handle
		if (!o.handleBackgroundColor && !o.handleBackgroundGradient) {
			handle.backgroundGradient = defaults.handleBackgroundGradient;
		} else {
			if (o.handleBackgroundColor) {
				handle.backgroundColor = o.handleBackgroundColor;	
			}
			if (o.handleBackgroundColor) {
				if (ps.axis === 'x') {
					o.handleBackgroundGradient
				}
				handle.backgroundGradient = o.handleBackgroundGradient;	
			}
		}	
	}
	
	// Position the event handling handle over the visible handle
	eventHandle = Ti.UI.createView({
		height: handle.height
	});
	//eventHandle = extend(eventHandle, ps.handle);
	eventHandle[position] = 0;
	eventHandle[ps.dimension] = o.handleSize || defaults.handleSize;
	eventHandle[ps.dimension === 'width' ? 'height' : 'width'] = '100%';
	
	// create touchmove handler for eventHandle
	var startPos = undefined;
	var lastPos = undefined;
	var direction = 1;
	var touchmoveHandler = function(e) {
		var parentMax = eventHandle.parent.size[ps.dimension] - eventHandle[ps.dimension];
		var newValue = eventHandle[position] + (ps.multiplier * (e[ps.axis] - startPos));
		
		if (newValue <= parentMax && newValue >= 0) {
			handle[position] = newValue;
		}
		
		if (lastPos !== undefined && lastPos <= handle[position]) {
			direction = 1; 	
		} else {
			direction = -1; 	
		}
		
		lastPos = handle[position]; 
	};
	
	eventHandle.addEventListener('touchstart', function(e) {
		//Ti.API.debug('touchstart');
		startPos = e[ps.axis];
		eventHandle.addEventListener('touchmove', touchmoveHandler);
	});
	
	eventHandle.addEventListener('touchend', function(e) {
		//Ti.API.debug('touchend');
		var parentMax = eventHandle.parent.size[ps.dimension] - eventHandle[ps.dimension];
		var finalPos = (direction > 0 ? parentMax : 0);
		var duration = 660;
		
		// reduce the duration as we approach each extreme
		duration *= (direction > 0) ? ((parentMax - handle[position]) / parentMax) : (handle[position] / parentMax);
		
		eventHandle.removeEventListener('touchmove', touchmoveHandler);
		if (handle[position] !== 0 && handle[position] !== parentMax) {
			var animation = { duration:duration };
			animation[position] = finalPos;
			handle.animate(animation);
			eventHandle[position] = finalPos;
		} else {
			eventHandle[position] = handle[position];		
		}
	});
	
	Ti.Gesture.addEventListener('orientationchange', function(e) {
		var parentMax = eventHandle.parent.size[ps.dimension] - eventHandle[ps.dimension];
		
		Ti.API.debug(handle[position] + ' > ' + parentMax);
		
		if (handle[position] > parentMax) {
			handle[position] = parentMax;
			eventHandle[position] = parentMax;	
		}
	});

	return [handle, eventHandle];
};