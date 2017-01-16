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
			app.doAction(action);

			setTimeout(function() {
				var target = {
					figure: null,
					coordination: null	
				};

				for (var i = 0; i < app.figures.length; i++) {
					for (var j = 0; j < data.selectedCols.length; j++) {
						var isAttackable = (action.id != "move" && 
							app.figures[i].coordination.r == data.selectedCols[j].r && 
							app.figures[i].coordination.c == data.selectedCols[j].c);

						if (isAttackable) {
							if (app.figures[i].team != app.currentFigure.team) {
								selectableFigures.push(app.figures[i]);

								if (target.figure == null || app.figures[i].tp < target.figure.tp) {
									target.figure = app.figures[i];
									target.coordination = app.figures[i].coordination;
								}
							}
						}
						else if (!isAttackable) {
							// move
							if (target.coordination == null || 
									(target.coordination.r > data.selectedCols[j].r && target.coordination.c > data.selectedCols[j].c)
								) {
									target.coordination = data.selectedCols[j];
							}
						}
					}
				}

				if (action.id != "move" && target.figure == null) {
					console.log("wait");
					app.doAction(app.getAction(app.currentFigure, "wait"));
				}
				else {
					app.selectCol(target.coordination.r, target.coordination.c);
				}
			}, 500);
		};

		var selectableFigures = [];
		var action;
		var accessible = false;

		if (app.isSubTurn) {
			action = app.getAction(app.currentFigure, "thunder");
			if (action == null || app.currentFigure.mp < action.mpCost) {
				action = app.getAction(app.currentFigure, "fight");
			}
			doAttack(action);
		}
		else {
			action = app.getAction(app.currentFigure, "move");
			// app.doAction(action);
			doAttack(action);

		}

		setTimeout(function() {
			app.chooseOrientation("top");
		}, 1000);
	}
};

var app = new Vue({
	el: "#app",
	data: {
		gameStarted: false,
		alertMessage: null,
		isMoving: false,
		isSubTurn: false,
		showOrientationControls: false,
		turnNumber: 0,
		rows: 6,
		cols: 8,
		currentFigure: null,
		selectedFigure: null,
		focusedFigure: null,
		selectedAction: null,
		selectedCols: [],
		teams: teams.teams,
		figures: teams.figures
	},
	methods: {
		initFigures: function() {
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
			}
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
							alert("Team '" + teams[0] + "' wins!\nPlay again?");
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
					if (isSubTurn) {
						// If is second turn wait until user chose the orientation
						app.showOrientationControls = true;
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
				bot.doTurn();
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

// Initialize figure data
app.initFigures();

// Removes splash screen when Vue is ready
document.querySelector("#splash").parentNode.removeChild(document.querySelector("#splash"));