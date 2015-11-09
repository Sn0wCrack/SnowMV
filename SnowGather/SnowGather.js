//=============================================================================
// SnowMV - Simple Gathering
// SnowGather.v2.js
// Version: 2.2.0
//=============================================================================

"use strict";

PluginManager.register("SnowGather", "2.2.0", {
	"email": "",
	"website": "",
	"name": "Sn0wCrack"
}, "2015-10-29")

//=============================================================================
 /*:
 * @plugindesc A simple way to manage "gathering" type events.
 * @author Sn0wCrack
 *
 * @param Successful Harvest Message
 * @desc Message to display upon sucessful harvest, %1 is the amount, %2 is the item name
 * @default You gathered %1 %2.
 *
 * @param Unsuccessful Harvest Message
 * @desc Message to display upon failing to harvest items
 * @default Failed to harvest any resources.
 *
 * @param Item Broken Message
 * @desc Message to display when an item breaks upon harvesting, %1 is the item name
 * @default Your %1 broke while harvesting!
 *
 * @param Incorrect Tools Message
 * @desc Message to display when you don't have the right tools
 * @default You don't have any tools that can be used here.
 *
 * @param Select Tool Message
 * @desc Help window message you want to display when player is selecting a tool
 * @default Please select the tool you wish to use
 *
 * @param Hand Tool ID
 * @desc The item ID of the tool that will be used as your hand
 * @default 10
 *
 * @param Hand Tool Last
 * @desc Do you want the hand tool to appear first or last in the items list. true = yes, false = no
 * @default false
 *
 * @param Respawning Events
 * @desc Override the default option when having a time system installed, true = ON, false = OFF
 * @default true
 *
 * @param Manual Self Switches
 * @desc If you wish to manually set self switches in your event for despawning them, true = ON, false = OFF
 * @default false
 *
 * @param Last Result Store
 * @desc If you want to store the last result of a harvest as a variable, true = ON, false = OFF
 * @default true
 *
 * @param Last Result Variable ID
 * @desc The variable to store the last result in, 0 = success, 1 = failure, 2 = incorrect tools
 * @default 1
 *
 * @help
 * ============================================================================
 * Introduction
 * ============================================================================
 * 
 * Welcome to the Simple Gathering System by Sn0wCrack, this script allows you
 * to create gathering events in which you players to search for resources using
 * tools (or not if you want!)
 *
 * Please see https://github.com/Sn0wCrack/SnowMV/blob/master/LICENSE for license
 * details.
 *
 * If you use this script, please give credit!
 *
 * ============================================================================
 * Setup
 * ============================================================================
 * In your items database you can tag any item (this means only normal items,
 * not weapons, armour, etc.) with the following tags:
 *
 * Havesting Tools:
 *
 * <Harvest Chance Boost: x%> - Not Required
 * This tag allows you to set an amount this particular item will boost
 * the chances of you finding items.
 *
 * <Harvest Chance>
 * itemId: percentage%
 * </Harvest Chance>
 *
 * You can set the chance for harvesting different materials for an item
 * by something like this:
 *	<Harvest Chance>
 *	7: 100%
 *  8: 10%
 * </Harvest Chance>
 *
 * <Chance Break>
 * </Chance Break>
 * 
 * Same as above however the values are how often the item will break when
 * trying to harvest the resource.
 *
 * Harvestables:
 *
 * <Harvest Minimum: x> - Required
 * The minimum amount of the item to be found upon the successful harvesting of 
 * it.
 *
 * <Harvest Maximum: x> - Required
 * The maximum amount of the item to be found upon the successful harvesting of 
 * it.
 *
 * Events:
 *
 * <Repspawn Time: x> - Required if you want respawing events (Requires OrangeTimeSystem)
 * Sets how long in hours you want the event to respawn in
 *
 * ============================================================================
 * Usage
 * ============================================================================
 * To call the script, create an event with a plugin command
 *		SnowGather  require tools [recieveable item ids] commonEventId this
 *
 * Replace require tools with true if you want the player to need tools to gather
 * items at this event, or false if you don't want them to use any tools on this
 * particular event spot.
 *
 * Recievable item ids is an array that you replace with something like [7,8]
 * please note how there are not spaces in this, keep it this way or it will not
 * function correctly. This sets the items taht you can get from this event.
 *
 * commonEventId is the id of the common event you want to run after selecting a tool
 * to harvest with. You may ignore this if you don't want to use it.
 *
 * this is well, always the word this, this is only required if you're using
 * a time system.
 *
 * Repsawning Events:
 *
 * In order for an event to actually despawn and then respawn after the allotted
 * time, you must first create second event page, on this page you just have to
 * have the self switch for "A" checked as a condition, leave everything else 
 * blank.
 *
 */
//=============================================================================

var Snow = Snow || {};
Snow.Gather = Snow.Gather || {};
Snow.Gather.Windows = Snow.Gather.Windows || {};
Snow.Gather.Scenes = Snow.Gather.Scenes || {};
Snow.Gather.Parameters = PluginManager.parameters("SnowGather");
Snow.Gather.PopEvents = false;

Snow.Gather.TempItems = [];
Snow.Gather.TempRecItems = [];
Snow.Gather.TempEvent = 0;
Snow.Gather.TempCommonEvent = 0;

Snow.Gather.WaitingEvents = [];

// Note Tag Stuff
			 
Snow.Gather.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
    if (!Snow.Gather.DataManager_isDatabaseLoaded.call(this)) {
		return false;
	}
	this.processNotetagsSnowGather($dataItems);
	return true;
};

// Time System Stuff

if (Imported["OrangeTimeSystem"] && MVC.Boolean(String(Snow.Gather.Parameters["Respawning Events"]))) {
	Snow.Gather.PopEvents = true;
	Snow.Gather.onChangeHour = function() {
		console.log("1 Hour Passess...");
		for (var i = 0; i < Snow.Gather.WaitingEvents.length; i++) {
			Snow.Gather.WaitingEvents[i].timeRemaining -= 1;
			if($gameMap.mapId() == Snow.Gather.WaitingEvents[i].mapId && Snow.Gather.WaitingEvents[i].timeRemaining <= 0) {
				var key = [$gameMap.mapId(), Snow.Gather.WaitingEvents[i].eventData.id, "A"];
				$gameSelfSwitches.setValue(key, false);
				Snow.Gather.WaitingEvents.splice(i, 1);
			}
		}
	}
	OrangeTimeSystem.on('changeHour', Snow.Gather.onChangeHour);
}

// More Note Tag Stuff

DataManager.processNotetagsSnowGather = function(group) {
	var note1 = /<(?:HARVEST CHANCE BOOST):[ ](\d+)([%%])>/i;
	var note2 = /<(?:CHANCE BREAK [\d+]):[ ](\d+)([%%])>/i;
	var note2_1 = /<(?:CHANCE BREAK)>/i;
	var note2_2 = /<\/(?:CHANCE BREAK)>/i;
	var note3 = /<(?:HARVEST CHANCE [\d+]):[ ](\d+)([%%])>/i;
	var note3_1 = /<(?:HARVEST CHANCE)>/i;
	var note3_2 = /<\/(?:HARVEST CHANCE)>/i;
	var note4 = /<(?:HARVEST MINIMUM):[ ](\d+)>/i;
	var note5 = /<(?:HARVEST MAXIMUM):[ ](\d+)>/i;
	
	var chanceBreakFlag = false;
	var harvestChanceFlag = false;
	
	for (var i = 1; i < group.length; i++) {
		var obj = group[i];
		obj.harvestChance = [];
		obj.chanceBreak = [];
		var notedata = obj.note.split(/[\r\n]+/);
		for (var n = 0; n < notedata.length; n++) {
			var line = notedata[n];
			if (line.match(note1)) {
				obj.harvestChanceBoost = parseFloat(RegExp.$1 * 0.01);
			} 
			else if (line.match(note2_2)) {
				chanceBreakFlag = false;
			}
			else if (line.match(note2_1)) {
				chanceBreakFlag = true;
			}
			else if (chanceBreakFlag) {
				var data = line.split(": ");
				if (data[1])
					data[1] = data[1].replace("%", "");
				obj.chanceBreak.push({itemId: Number(data[0]), chanceBreak: parseFloat(Number(data[1]) * 0.01)});
			}
			else if (line.match(note3_2)) {
				harvestChanceFlag = false;
			}
			else if (line.match(note3_1)) {
				harvestChanceFlag = true;
			}
			else if (harvestChanceFlag) {
				var data = line.split(": ");
				if (data[1])
					data[1] = data[1].replace("%", "");
				obj.harvestChance.push({itemId: Number(data[0]), harvestChance: parseFloat(Number(data[1]) * 0.01)});
			}

			else if (line.match(note4)) {
				obj.harvestMinimum = parseInt(RegExp.$1);
			}
			else if (line.match(note5)) {
				obj.harvestMaximum = parseInt(RegExp.$1);
			}
		}
	}
}

// Helper Functons

Snow.Gather.idIntoItem = function(id) {
	return $dataItems[id];
}

Snow.Gather.RandomInt = function() {
	return Math.random();
}

Snow.Gather.RandomIntRange = function(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

Snow.Gather.Round = function(value, decimals) {
	return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
}

// Windows

var ItemChoiceWindow = function() {
	this.initialize.apply(this, arguments);
}

ItemChoiceWindow.prototype = Object.create(Window_ItemList.prototype);
ItemChoiceWindow.prototype.constructor = ItemChoiceWindow;

ItemChoiceWindow.prototype.initialize = function(x, y, width, height) {
	Window_ItemList.prototype.initialize.call(this, x, y, width, height);
	this._data = [];
	this.activate();
	this.refresh();
    this.select(0);
}

ItemChoiceWindow.prototype.isEnabled = function(item) {
    return true;
}

ItemChoiceWindow.prototype.makeItemList = function() {
	this._data = Snow.Gather.TempItems;
}

ItemChoiceWindow.prototype.drawItemNumber = function(item, x, y, width) {
	if (this.needsNumber() && item.id != Number(Snow.Gather.Parameters["Hand Tool ID"])) {
        this.drawText(':', x, y, width - this.textWidth('00'), 'right');
        this.drawText($gameParty.numItems(item), x, y, width, 'right');
    }
}

Snow.Gather.Windows.ItemChoiceWindow = ItemChoiceWindow;


var ItemChoiceHelpWindow = function() {
	this.initialize.apply(this, arguments);
}

ItemChoiceHelpWindow.prototype = Object.create(Window_Help.prototype);
ItemChoiceHelpWindow.prototype.constructor = ItemChoiceHelpWindow;

ItemChoiceHelpWindow.prototype.initialize = function(numLines) {
	Window_Help.prototype.initialize.call(this, numLines);
}	

Snow.Gather.Windows.ItemChoiceHelpWindow = ItemChoiceHelpWindow;

// Scenes

var ToolChoice = function() {
	this.initialize.apply(this, arguments);
}

ToolChoice.prototype = Object.create(Scene_ItemBase.prototype);
ToolChoice.prototype.constructor = ToolChoice;

ToolChoice.prototype.initialize = function(data) {
	Scene_ItemBase.prototype.initialize.call(this);
}

ToolChoice.prototype.create = function() {
	Scene_ItemBase.prototype.create.call(this);
	this._createItemChoiceHelpWindow();
	this._createItemChoiceWindow();
}

ToolChoice.prototype.start = function() {
	 Scene_ItemBase.prototype.start.call(this);
}

ToolChoice.prototype._createItemChoiceWindow = function() {
	this._itemChoiceWindow = new Snow.Gather.Windows.ItemChoiceWindow(0, this._itemChoiceHelpWindow.height, Graphics.boxWidth, Graphics.boxHeight - this._itemChoiceHelpWindow.height);
	this._itemChoiceWindow.setHandler('ok', this._onItemChoiceWindowOK.bind(this));
	this._itemChoiceWindow.setHandler('cancel', this._onItemChoiceWindowCancel.bind(this));
	this.addWindow(this._itemChoiceWindow);
}

ToolChoice.prototype._createItemChoiceHelpWindow = function() {
	this._itemChoiceHelpWindow = new Snow.Gather.Windows.ItemChoiceHelpWindow(1);
	this._itemChoiceHelpWindow.setText(Snow.Gather.Parameters["Select Tool Message"]);
	this.addWindow(this._itemChoiceHelpWindow);
}

ToolChoice.prototype._onItemChoiceWindowOK = function() {
	var selected = this._itemChoiceWindow.item();
	Snow.Gather.Gather2(selected, Snow.Gather.TempRecItems, Snow.Gather.TempEvent, Snow.Gather.TempCommonEvent);
	this.popScene();
}

ToolChoice.prototype._onItemChoiceWindowCancel = function() {
	this.popScene();
}

Snow.Gather.Scenes.ToolChoice = ToolChoice;

// Actual Gathering Stuff

Snow.Gather.Gather = function(requireItem, recievableItems, commonEvent, event) {
	event = event || {_eventId: 0};
	commonEvent = commonEvent || 0;
	var eventId = event._eventId;
	if (requireItem == false) {
		var itemisedRecievableItems = [];
		for (var i = 0; i < recievableItems.length; i++) {
			itemisedRecievableItems[i] = Snow.Gather.idIntoItem(recievableItems[i]);
		}
		
		var resourceGet = 0;
		var hand = Snow.Gather.idIntoItem(Number(Snow.Gather.Parameters["Hand Tool ID"]));
		
		for (var i = 0; i < itemisedRecievableItems.length; i++) {
			var gen = Snow.Gather.Round(Snow.Gather.RandomInt(), 2);
			for (var j = 0; j < hand.chanceHarvest.length; j++) {
				if (hand.chaceHarvest[j].itemId == itemisedRecievableItems[i].id) {
					if (gen <= hand.chaceHarvest[j].chanceHarvest) {
						var itemGathered = Snow.Gather.RandomIntRange(itemisedRecievableItems[i].harvestMinimum, itemisedRecievableItems[i].harvestMaximum);
						$gameParty.gainItem(itemisedRecievableItems[i], itemGathered);
						if (MVC.Boolean(String(Snow.Gather.Parameters["Last Result Store"]))) {
							$gameVariables.setValue(Number(Snow.Gather.Parameters["Last Result Variable ID"]), 0); 
						}
						$gameMessage.add(Snow.Gather.Parameters["Successful Harvest Message"].replace("%1", itemGathered).replace("%2", itemisedRecievableItems[i].name));
						resourceGet++;
					} else {
						if (MVC.Boolean(String(Snow.Gather.Parameters["Last Result Store"]))) {
							$gameVariables.setValue(Number(Snow.Gather.Parameters["Last Result Variable ID"]), 1); 
						}
					}	
				}
			}
		}
		
		if (resourceGet == 0) {
			$gameMessage.add(Snow.Gather.Parameters["Unsuccessful Harvest Message"]);
		}
		
		if (Snow.Gather.PopEvents) {
			Snow.Gather.WaitingEvents.push({
				mapId: $gameMap.mapId(),
				eventData: $dataMap.events[eventId], 
				timeRemaining: Number($dataMap.events[eventId].meta["Respawn Time"])
			});
			
			if (!MVC.Boolean(String(Snow.Gather.Parameters["Manual Self Switches"])))
			{
				$gameSelfSwitches.setValue([$gameMap.mapId(), eventId, "A"], true);
			}
		}
	} else {
		var playerUsableItems = [];
		var itemisedRecievableItems = [];
		var playerInventory = $gameParty.items();
		
		for (var i = 0; i < recievableItems.length; i++) {
			itemisedRecievableItems[i] = Snow.Gather.idIntoItem(recievableItems[i]);
		}
		
		var hand = Snow.Gather.idIntoItem(Number(Snow.Gather.Parameters["Hand Tool ID"]));
		
		if (!MVC.Boolean(Snow.Gather.Parameters["Hand Tool Last"])) {
			for (var j = 0; j < recievableItems.length; j++) {
				for (var k = 0; k < hand.harvestChance.length; k++) {
					if (hand.harvestChance[k].itemId == recievableItems[j]) {
						if (!playerUsableItems.contains(hand)) {
							playerUsableItems.push(hand);
						}
					}
				}
			}
		}

		
		for (var i = 0; i < playerInventory.length; i++) {
			if (playerInventory[i].harvestChance !== []) {
				for (var j = 0; j < recievableItems.length; j++) {
					for (var k = 0; k < playerInventory[i].harvestChance.length; k++) {
						if (playerInventory[i].harvestChance[k].itemId == recievableItems[j]) {
							if (!playerUsableItems.contains(playerInventory[i])) {
								playerUsableItems.push(playerInventory[i]);
							}
						}
					}
				}
			}
		}
		
		if (MVC.Boolean(Snow.Gather.Parameters["Hand Tool Last"])) {
			for (var j = 0; j < recievableItems.length; j++) {
				for (var k = 0; k < hand.harvestChance.length; k++) {
					if (hand.harvestChance[k].itemId == recievableItems[j]) {
						if (!playerUsableItems.contains(hand)) {
							playerUsableItems.push(hand);
						}
					}
				}
			}
		}
		
		if (playerUsableItems.length == 0) {
			if (MVC.Boolean(String(Snow.Gather.Parameters["Last Result Store"]))) {
				$gameVariables.setValue(Number(Snow.Gather.Parameters["Last Result Variable ID"]), 2); 
			}
			$gameMessage.add(Snow.Gather.Parameters["Incorrect Tools Message"]);
			return;
		}
		
		Snow.Gather.TempItems = playerUsableItems;
		Snow.Gather.TempRecItems = itemisedRecievableItems;
		Snow.Gather.TempEvent = eventId;
		Snow.Gather.TempCommonEvent = commonEvent;
		
		SceneManager.push(Snow.Gather.Scenes.ToolChoice);
	}
}

Snow.Gather.Gather2 = function(chosenItem, recieveableItems, eventId, commonEvent) {
	var resourceGet = 0;
	
	var harvestChanceBoost = chosenItem.harvestChanceBoost || 0.0;
	
	if (commonEvent > 0)  {
		$gameTemp.reserveCommonEvent(commonEvent);
	}
	
	for (var i = 0; i < recieveableItems.length; i++) {
		var gen = Snow.Gather.Round(Math.max(0, Snow.Gather.RandomInt() - harvestChanceBoost), 2);
		for (var j = 0; j < chosenItem.harvestChance.length; j++) {
			if (recieveableItems[i].id == chosenItem.harvestChance[j].itemId) {
				if (gen <= chosenItem.harvestChance[j].harvestChance) {
					var itemGathered = Snow.Gather.RandomIntRange(recieveableItems[i].harvestMinimum, recieveableItems[i].harvestMaximum);
					$gameParty.gainItem(recieveableItems[i], itemGathered);
					if (MVC.Boolean(String(Snow.Gather.Parameters["Last Result Store"]))) {
						$gameVariables.setValue(Number(Snow.Gather.Parameters["Last Result Variable ID"]), 0); 
					}
					$gameMessage.add(Snow.Gather.Parameters["Successful Harvest Message"].replace("%1", itemGathered).replace("%2", recieveableItems[i].name));
					resourceGet++;
				} else {
					if (MVC.Boolean(String(Snow.Gather.Parameters["Last Result Store"]))) {
						$gameVariables.setValue(Number(Snow.Gather.Parameters["Last Result Variable ID"]), 1); 
					}
				}
			}
		}
	}
	
	if (chosenItem.chanceBreak !== undefined) {
		var itemBroken = false;
		for (var i = 0; i < recieveableItems.length; i++) {
			for (var j = 0; j < chosenItem.chanceBreak.length; j++) {
				if (chosenItem.chanceBreak[j].itemId == recieveableItems[i].id) {
					var gen = Snow.Gather.Round(Snow.Gather.RandomInt(), 2);
					if (chosenItem.chanceBreak[j].chanceBreak >= gen && !itemBroken) {
						itemBroken = true;
						$gameParty.loseItem(chosenItem, 1);
						$gameMessage.add(Snow.Gather.Parameters["Item Broken Message"].replace("%1", chosenItem.name));
					}
				}
			}
		}
	}

	if (resourceGet == 0) {
		$gameMessage.add(Snow.Gather.Parameters["Unsuccessful Harvest Message"]);
	}
	
	if (Snow.Gather.PopEvents) {
		Snow.Gather.WaitingEvents.push({
			mapId: $gameMap.mapId(),
			eventData: $dataMap.events[eventId], 
			timeRemaining: Number($dataMap.events[eventId].meta["Respawn Time"])
		});
		
		if (!MVC.Boolean(String(Snow.Gather.Parameters["Manual Self Switches"])))
		{
			$gameSelfSwitches.setValue([$gameMap.mapId(), eventId, "A"], true);
		}
	}
}	



var Snow_Gather_Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
	Snow_Gather_Game_Interpreter_pluginCommand.call(this, command, args);
	if (command === "SnowGather") {
		if (args.length == 4) {
			Snow.Gather.Gather(JSON.parse(args[0]), JSON.parse(args[1]), JSON.parse(args[2]), eval(args[3]));
		} else if (args.length == 3) {
			Snow.Gather.Gather(JSON.parse(args[0]), JSON.parse(args[1]), eval(args[2]));
		} else {
			Snow.Gather.Gather(JSON.parse(args[0]), JSON.parse(args[1]))
		}
		
	}
}