function hasClass(el, className) {
	if (el.classList)
		return el.classList.contains(className)
	else
		return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'))
}

function addClass(el, className) {
	if (el.classList)
		el.classList.add(className)
	else if (!hasClass(el, className)) 
		el.className += " " + className
}

function removeClass(el, className) {
	if (el.classList)
		el.classList.remove(className)
	else if (hasClass(el, className)) {
		el.className=el.className.replace(new RegExp('(\\s|^)' + className + '(\\s|$)'), ' ')
	}
}

var data = {
	selectedCols: []
};

var events = {
	selectedCol: new Event("selectedCol"),
	selectedAction: new Event("selectedAction"),
	selectedOrientation: new Event("selectedOrientation")
};

var bot = {
	doTurn: function() {
		var doAttack = function(action) {
			var closestRivalFigure = app.getClosestRivalFigure();
			console.log(closestRivalFigure);
			data.selectedCols = [];
			app.doAction(action);

			setTimeout(function() {
				var target = {
					figure: null,
					coordination: {
						r: 1000,
						c: 1000
					},
					diffR: {
						r: null,
						c: null,
						diff: null
					},
					diffC: {
						r: null,
						c: null,
						diff: null
					}
				};

				console.log(data.selectedCols);			

				// Go thru each figure
				for (var i = 0; i < app.figures.length; i++) {
					// And thru each selectable col
					for (var j = 0; j < data.selectedCols.length; j++) {

						// The figure is attackable when action is not "move" and it is on a selectable col
						var isAttackable = (action.id != "move" && 
							app.figures[i].coordination.r == data.selectedCols[j].r && 
							app.figures[i].coordination.c == data.selectedCols[j].c);

						if (isAttackable) {
							if (app.figures[i].team != app.currentFigure.team) {
								// Add to selectable figures
								selectableFigures.push(app.figures[i]);

								// Set figure as target when its TP is lower then the others
								if (target.figure == null || app.figures[i].tp < target.figure.tp) {
									target.figure = app.figures[i];
									target.coordination = app.figures[i].coordination;
								}
							}
						}
						else if (action.id == "move" && (app.figures[i].coordination.r != data.selectedCols[j].r || 
							app.figures[i].coordination.c != data.selectedCols[j].c)) {

							var diffR = Math.abs(data.selectedCols[j].r - closestRivalFigure.coordination.r);
							var diffC = Math.abs(data.selectedCols[j].c - closestRivalFigure.coordination.c);

							if (target.diffR.r == null || target.diffR.diff > diffR) {
								target.diffR = data.selectedCols[j];
								target.diffR.diff = diffR;
							}

							if (target.diffC.c == null || target.diffC.diff > diffC) {
								target.diffC = data.selectedCols[j];
								target.diffC.diff = diffC;
							}
						}
					}
				}

				console.log(target);
				console.log("----");

				if (action.id != "move" && target.figure == null) {
					console.log("wait");
					app.doAction(app.getAction(app.currentFigure, "wait"));
				}
				else {
					if (action.id == "move") {
						target.coordination = target.diffC.diff < target.diffR.diff ? target.diffC : target.diffR;
					}
					app.selectCol(target.coordination.r, target.coordination.c);
				}
			}, 500);
		};

		var selectableFigures = [];
		var action;
		var accessible = false;

		if (app.isSubTurn) {
			// If is second turn try to attack
			action = app.getAction(app.currentFigure, "thunder");
			if (action == null || app.currentFigure.mp < action.mpCost) {
				action = app.getAction(app.currentFigure, "fire");

				if (action == null || app.currentFigure.mp < action.mpCost) {
					action = app.getAction(app.currentFigure, "fight");
				}
			}
			doAttack(action);
		}
		else {
			// If is first turn try to move
			action = app.getAction(app.currentFigure, "move");
			// app.doAction(action);
			doAttack(action);

		}

		setTimeout(function() {
			app.chooseOrientation(app.currentFigure.orientation);
		}, 1000);
	}
};

Vue.config.debug = true;

var app = new Vue({
	el: "#app",
	data: {
		gameStarted: false,
		alertMessage: null,
		isMoving: false,
		isSubTurn: false,
		showControls: true,
		showOrientationControls: false,
		turnNumber: 0,
		rows: 6,
		cols: 8,
		colObjs: [],
		currentFigure: null,
		selectedFigure: null,
		focusedFigure: null,
		selectedAction: null,
		selectedCols: [],
		teams: teams.teams,
		figures: teams.figures,
		patterns: [
			{
				id: "grass",
				coordination: [
					{ r: 0, c: 0 },
					{ r: 0, c: 1 },
					{ r: 1, c: 0 },
					{ r: 5, c: 7 },
					{ r: 4, c: 7 },
					{ r: 5, c: 6 },
					{ r: 4, c: 6 },
					{ r: 3, c: 7 },
					{ r: 3, c: 6 },
					{ r: 2, c: 7 },
					{ r: 5, c: 5 },
					{ r: 5, c: 4 },
				]
			},
			{
				id: "grassBegin",
				coordination: [
					{ r: 4, c: 5 },
					{ r: 3, c: 5 },
				]
			}
		]
	},
	methods: {
		initStuff: function() {
			for (var i = 0; i < app.teams.length; i++) {
				app.teams[i].hueRotation = (180 / (app.teams.length-1) * i) + "deg";
			}

			for (var i = 0; i < app.figures.length; i++) {
				// Set max points 
				app.figures[i].maxTp = app.figures[i].tp;
				app.figures[i].maxMp = app.figures[i].mp;

				// Set default actions
				app.figures[i].action.push({
					id: "wait"
				});

				// Set team obj into figure object
				app.figures[i].teamObj = app.teams[app.figures[i].team];

				app.figures[i].moveDirection = false;
				app.figures[i].damage = 0;
			}
		},
		getPatternId: function(rIndex, cIndex) {
			if (app) {
				for (var i = 0; i < app.patterns.length; i++) {
					for (var j = 0; j < app.patterns[i].coordination.length; j++) {
						if (app.patterns[i].coordination[j].r == rIndex && app.patterns[i].coordination[j].c == cIndex) {
							return app.patterns[i].id;
						}
					}
				}
			}
			return null;
		},
		figureInfoIn: function() {
			// Fade in animation for figure info
			var el = document.querySelector("#figure-info");
			el.style.backgroundColor = app.currentFigure.teamObj.color;
			addClass(el, "in");
			setTimeout(function() {
				removeClass(el, "in");
			}, 500);
		},
		focusFigure: function(figure) {
			// A figure was focused by the user by tipping on it
			if (app.focusedFigure != figure) {
				app.focusedFigure = figure;
				var el = document.querySelector("#focused-figure-info");
				el.style.backgroundColor = app.focusedFigure.teamObj.color;
				addClass(el, "in");
				setTimeout(function() {
					removeClass(el, "in");
				}, 500);
			}
			else {
				app.focusedFigure = null;
			}
		},
		alert: function(message) {
			// Put out information
			app.alertMessage = message;
			setTimeout(function() {
				app.alertMessage = null;
			}, 3000);
		},
		getClosestRivalFigure: function(figure) {
			figure = figure || app.currentFigure;
			var closest = {
				r: null,
				diffR: null,
				c: null,
				diffC: null
			};

			for (var i = 0; i < app.figures.length; i++) {
				if (app.figures[i].team != figure.team) {
					var diffR = Math.abs(figure.coordination.r - app.figures[i].coordination.r);
					var diffC = Math.abs(figure.coordination.c - app.figures[i].coordination.c);

					if (closest.r == null || diffR < closest.diffR) {
						closest.r = app.figures[i];
						closest.diffR = diffR;
					}

					if (closest.c == null || diffC < closest.diffC) {
						closest.c = app.figures[i];
						closest.diffC = diffC;
					}
				}
			}

			if (closest.diffC < closest.diffR) {
				return closest.r;
			}
			else {
				return closest.c;
			}
		},
		getAction: function(figure, actionId) {
			// Gets the action of a figure based on the action ID
			for (var j = 0; j < figure.action.length; j++) {
				if (figure.action[j].id == actionId) 
					return figure.action[j];
			}
			return null;
		},
		isColSelectable: function(rIndex, cIndex) {
			// Calculate if current col is selectable
			var sR = app.selectedFigure.coordination.r;
			var sC = app.selectedFigure.coordination.c;
			var diffR = Math.abs(sR - rIndex);
			var diffC = Math.abs(sC - cIndex);

			var retVal = (diffR + diffC) <= app.selectedAction.range;
			if (retVal && app.selectedAction.id == "move") {
				retVal = !document.querySelector("#col-r" + rIndex + "-c" + cIndex + " .figure");
			}
			else if (retVal) {
				retVal = document.querySelector("#col-r" + rIndex + "-c" + cIndex + " .figure");
			}
			if (retVal) {
				data.selectedCols.push({r: rIndex, c: cIndex});
			}
			return retVal;
		},
		selectCol: function(rIndex, cIndex) {
			var attack = function() {
				// Check if attack will strike
				if (Math.random() > app.selectedAction.missRange) {
					// Manipulate TP of target
					// If the attack brings damage its TP has to be negative.
					// If it is heal it has to be positive.
					app.figures[i].tp += app.selectedAction.tp;
					// app.figures[i].deviation = 0;
					app.figures[i].deviation = app.selectedAction.tp > 0 ? "+" + app.selectedAction.tp : app.selectedAction.tp;

					(function(i) {
						setTimeout(function() {
							app.figures[i].deviation = 0;
						}, 1000);
					})(i);

					// Check if new TP is not over max TP
					if (app.figures[i].tp > app.figures[i].maxTp) {
						app.figures[i].tp = app.figures[i].maxTp;
					}

					if (app.figures[i].tp <= 0) {
						// Target figure is dead
						var team = app.figures[i].team;
						app.alert(app.figures[i].id + " is KO!");
						app.figures.splice(i, 1);

						// Check if the figure was the lost one of its team
						var teamDead = true;
						var teams = [];
						for (var j = 0; j < app.figures.length; j++) {
							if (app.figures[j].team == team) {
								teamDead = false;
							}
							if (!(teams.indexOf(app.figures[j].team) > -1)) {
								teams.push(app.figures[j].team);
							}
						}
						if (teams.length <= 1) {
							// No more teams left
							if (teams[0].id == "Good") {
								alert("You win!\nPlay again?");
							}
							else {
								alert("You loose!\nPlay again?");
							}
							location.reload();
						}
						else if (teamDead) {
							// The team is KO
							app.alert("Team '" + team + "' is KO!");
						}
					}	
				}
				else {
					app.alert("Missed!");
				}
			};

			var timer;
			var figureMoveDirection;
			var figureAfterMove = null;
			var figureMoveChecker = function() {
				var prop, value;
				if (figureMoveDirection == "top" || figureMoveDirection == "bottom") {
					prop = "r";
					value = rIndex;
				}
				else {
					prop = "c";
					value = cIndex;
				}

				if (app.currentFigure.coordination[prop] != value) {
					// Didn't get to the target col yet
					app.isMoving = true;
					app.currentFigure.moveDirection = figureMoveDirection;
					if (figureMoveDirection == "top" || figureMoveDirection == "left") {
						app.currentFigure.coordination[prop]--;
					}
					else {
						app.currentFigure.coordination[prop]++;
					}
				}
				else {
					// Reached target col, leave
					if (!figureAfterMove) {
						finish();
					}
					else {
						figureAfterMove();
						figureAfterMove = null;
					}
				}
			};

			var finish = function() {
				// Movement was finished, reset things and dispatch event
				app.isMoving = false;
				clearInterval(timer);
				app.currentFigure.moveDirection = null;
				app.selectedFigure = null;
				document.dispatchEvent(events.selectedCol);
			}

			if (app.isColSelectable(rIndex, cIndex)) {
				if (app.selectedAction.id == "move") {
					// When target col is selectable and action is "move" do animation

					for (var fi = 0; fi < app.figures.length; fi++) {
						if (app.figures[fi].coordination.r == rIndex && app.figures[fi].coordination.c == cIndex) {
							// When there is already a figure on the target col, exit
							return;
						}
					}

					if (rIndex < app.currentFigure.coordination.r && cIndex < app.currentFigure.coordination.c) {
						// top left
						figureMoveDirection = "top";
						figureAfterMove = function() {
							figureMoveDoFinish = true;
							figureMoveDirection = "left";
							app.currentFigure.orientation = figureMoveDirection;
						};
					}
					else if (rIndex < app.currentFigure.coordination.r && cIndex > app.currentFigure.coordination.c) {
						// top right
						figureMoveDirection = "top";
						figureAfterMove = function() {
							figureMoveDoFinish = true;
							figureMoveDirection = "right";
							app.currentFigure.orientation = figureMoveDirection;
						};
					}
					else if (rIndex > app.currentFigure.coordination.r && cIndex < app.currentFigure.coordination.c) {
						// bottom left
						figureMoveDirection = "bottom";
						figureAfterMove = function() {
							figureMoveDoFinish = true;
							figureMoveDirection = "left";
							app.currentFigure.orientation = figureMoveDirection;
						};
					}
					else if (rIndex > app.currentFigure.coordination.r && cIndex > app.currentFigure.coordination.c) {
						// bottom right
						figureMoveDirection = "bottom";
						figureAfterMove = function() {
							figureMoveDoFinish = true;
							figureMoveDirection = "right";
							app.currentFigure.orientation = figureMoveDirection;
						};
					}					
					if (rIndex < app.currentFigure.coordination.r) {
						figureMoveDirection = "top";
					}
					else if (rIndex > app.currentFigure.coordination.r) {
						figureMoveDirection = "bottom";
					}
					else if (cIndex < app.currentFigure.coordination.c) {
						figureMoveDirection = "left";
					}
					else if (cIndex > app.currentFigure.coordination.c) {
						figureMoveDirection = "right";
					}
					else {
						app.currentFigure.coordination.r = rIndex;
						app.currentFigure.coordination.c = cIndex;
						finish();
					}

					app.currentFigure.orientation = figureMoveDirection;

					// Move step for step to the target col
					figureMoveChecker();
					timer = setInterval(figureMoveChecker, 500);
				}
				else {
					for (var i = 0; i < app.figures.length; i++) {
						if (app.figures[i].coordination.r == rIndex && app.figures[i].coordination.c == cIndex) {
							if (app.selectedAction.mpCost) {
								if (app.currentFigure.mp >= app.selectedAction.mpCost) {
									app.currentFigure.mp -= app.selectedAction.mpCost;
									attack();
								}
								else {
									app.alert("You don't have enough MP!");
								}
							}
							else {
								attack();
							}
						}
					}
					finish();
				}
			}
		},
		doAction: function(action) {
			data.selectedCols = [];
			app.selectedAction = action;
			app.selectedFigure = app.currentFigure;

			document.dispatchEvent(events.selectedAction);
		},
		chooseOrientation: function(orientation) {
			app.currentFigure.orientation = orientation;
			document.dispatchEvent(events.selectedOrientation);
		},
		turn: function(figureIndex, isSubTurn) {
			// Here everything starts. Each figure always can do two actions. 
			// So actually turn will always get executed two times. 
			// That's why isSubTurn exists. When it is true, it is the second  subturn.

			// Reset data about current state
			app.showOrientationControls = false;
			app.selectedAction = null;
			app.selectedFigure = null;

			figureIndex = figureIndex || 0;
			isSubTurn = isSubTurn || false;
			app.isSubTurn = isSubTurn;

			var figure = app.figures[figureIndex];
			if (typeof(figure) == "undefined" || figure == null) {
				figureIndex = 0;
				figure = app.figures[figureIndex];
			}

			app.currentFigure = figure;

			// If is not second turn, fade in figure info
			if (!isSubTurn) {
				app.figureInfoIn();
			}

			// Callback functions
			var callback = {
				actionChange: function() {
					if (app.selectedAction.id == "wait") {
						// If action is "wait" do what comes next
						callback.afterActionChange();
					}
					else {
						// In case of attack or move wait until target col was selected
						document.addEventListener("selectedCol", callback.afterActionChange, false);
					}

					
				},
				afterActionChange: function() {
					document.removeEventListener("selectedAction", callback.actionChange , false);
					document.removeEventListener("selectedCol", callback.afterActionChange, false);
					if (isSubTurn || app.selectedAction.id == "wait") {
						// If is second turn wait until user chose the orientation
						app.showOrientationControls = true;
						app.focusFigure(app.focusedFigure);
						document.addEventListener("selectedOrientation", callback.orientationChange, false);
					}
					else {
						// In other case do what comes next
						callback.orientationChange();
					}
				},
				orientationChange: function() {
					document.removeEventListener("selectedOrientation", callback.orientationChange, false);
					if (isSubTurn || app.selectedAction.id == "wait") {
						// End turn and change figure
						app.turn(figureIndex+1);
					}
					else {
						// End turn and start next one as a subturn with the same figure
						app.turn(figureIndex, true);
					}
				}				
			};

			// Wait until the user chose an action
			document.addEventListener("selectedAction", callback.actionChange, false);

			// If team is bot, let bot do things
			if (figure.teamObj.id == "Bot" || figure.teamObj.id == "GoodBot") {
				app.showControls = false;
				bot.doTurn();
			}
			else {
				app.showControls = true;
			}

			// Increase the count of turns by 1
			app.turnNumber++;
		},
		startGame: function() {
			app.gameStarted = true;
			app.turn();
		}
	}
});

// Initialize data
app.initStuff();

// Removes splash screen when Vue is ready
document.querySelector("#splash").parentNode.removeChild(document.querySelector("#splash"));