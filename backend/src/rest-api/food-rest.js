import {User, Food, FoodRestriction, UserRestriction, Meal, Location, LocationTimes, LocationFoodBridge} from './models.js'
import { Sequelize, Op } from 'sequelize';
import express from 'express'

const sequelize = new Sequelize('postgres://umassmealbuilderdb:Umass320!@34.145.185.28:5432/umassmealbuilderdb');

async function findFood(key, value) { //find food with given key and value
    let food = await Food.findOne({
        where: {
            [key]: value
        }
    });
    if (food === null) return null;
    else {
        return {
            foodId: food.foodId,
            name: food.name,
            calories: food.calories,
            fat: food.fat,
            saturatedFat: food.saturatedFat,
            protein: food.protein,
            carbs: food.carbs,
            category: food.category,
            ingredients: food.ingredients,
            healthfulness: food.healthfulness,
            servingSize: food.servingSize,
            recipeLabels: food.recipeLabels
        };
    }
}

/*async function findRestrictions(key, value) { //find restrictions with given key and value
    let list = [];
    const restrictions = await FoodRestriction.findAll({
        where: {
            [key]: value
        }
    });

    restrictions.forEach(restriction => {
        list.push({
            restriction: restriction.restriction,
            foodId: restriction.foodId,
        });
    });

    return list;
}*/

/*async function createFoodRestriction(name, restriction) { //add restriction to food
    let food = findFood('name', name);
    await FoodRestriction.create({restriction: restriction, foodId: food.foodId});

    return 'Created ' + restriction + ' restriction for food: ' + name;
}*/

/*async function findFoodsWithRestriction(restriction) { //find all foods with given restriction
    const list = [];
    const restrictionList = findRestrictions('restriction', restriction);
    restrictionList.forEach(restriction => {
        let food = findFood('foodId', restriction.foodId);
        list.push({
            foodId: food.foodId,
            name: food.name,
            calories: food.calories,
            fat: food.fat,
            saturatedFat: food.saturatedFat,
            carbs: food.carbs,
            ingredients: food.ingredients,
            halthfulness: food.halthfulness,
            servingSize: food.servingSize
        });
    });

    return list;
}*/

async function findLocationFoodBridges(key, value) { //find restrictions with given key and value
    const list = [];
    const bridges = await LocationFoodBridge.findAll({
        where: {
            [key]: value
        }
    });

    bridges.forEach(bridge => {
        list.push({
            Date: bridge.Date,
            Time: bridge.Time,
            foodId: bridge.foodId,
            locationId: bridge.locationId
        });
    });
    return list;
}

async function findFoodsAtLocationOnDate(locationId, date) {
    let bridgeList = await findLocationFoodBridges('locationId', locationId);
    let retObj = {'Breakfast': [], 'Lunch': [], 'Dinner': [], 'Late Night': []};
    for (let i = 0; i<bridgeList.length; i++) { //loop through all bridges
        let bridge = bridgeList[i]; //current bridge
        if (bridge.Date === date) { //if date matches
            let food = await findFood('foodId', bridge.foodId); //find food of bridge
            if(retObj.hasOwnProperty(bridge.Time)) { //if in current time
                let categoryFound = false; //cateogry exists flag
                retObj[bridge.Time].forEach(categoryObj => { //loop through category objects
                    if (categoryObj.category === food.category) { //if category is a match with current food, add to list
                        categoryFound = true;
                        (categoryObj.recipes).push(
                            {name: food.name, foodId: food.foodId}
                        )
                    }
                });
                if (!categoryFound) { //if no category objects matched, create new category object
                    retObj[bridge.Time].push({
                        'category': food.category,
                        'recipes': [{name: food.name, foodId: food.foodId}]
                    });
                }
            }
        }
    }
    return retObj;
}

// -------------------------
// Rest API
// -------------------------
const app = express()
const port = 3000

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/createFood', (req, res) => {
    (async function createAndSend(){
        const data = req.body;
        const duplicate = await Food.findOne({
            where: {
                name: data.name
            }
        });
        if (duplicate !== null) res.send('ERROR: ' + data.name + ' already exists!');
        else {
            const food = await Food.create({
                name: data.name,
                calories: data.calories,
                fat: data.fat,
                saturatedFat: data.saturatedFat,
                protein: data.protein,
                carbs: data.carbs,
                category: data.category,
                ingredients: data.ingredients,
                healthfulness: data.healthfulness, 
                servingSize: data.servingSize,
                recipeLabels: data.recipeLabels
            });
            res.send(data.name + ' Successfully Created with Food ID: ' + food.foodId);
        }
    })();
});

app.post('/addFoodToLocation', (req, res) => {
    (async function createAndSend(){
        const data = req.body;
        const food = await findFood('foodId', data.foodId);
        if (food === null) res.send('ERROR: Food with ID ' + data.foodId + ' does not exist!');
        else {
            const location = await Location.findOne({
                where: {
                    locationName: data.diningHall
                }
            });
            if (location === null) res.send('ERROR: ' + data.diningHall + ' is not a location!');
            else {
                const duplicate = await LocationFoodBridge.findOne({
                    where: {
                        Date: data.date,
                        Time: data.time,
                        foodId: data.foodId,
                        locationId: location.locationId
                    }
                })
                if (duplicate !== null) res.send('ERROR: ' + food.name + ' is already linked to ' + data.diningHall + ' during ' + data.time + ' on ' + data.date + '!');
                else {
                    const bridge = await LocationFoodBridge.create({
                        Date: data.date,
                        Time: data.time,
                        foodId: data.foodId,
                        locationId: location.locationId
                    });
                    res.send('Succesfully Added ' + food.name + ' (Food ID: ' + data.foodId + ') to ' + data.diningHall + ' during ' + data.time + ' on ' + data.date + '.');
                }
            }
        }
    })();
});

app.post('/removeFoodFromLocation', (req, res) => {
    (async function createAndSend() {
        const data = req.body;
        const location = await Location.findOne({
            where: {
                locationName: data.diningHall
            }
        });
        if (location === null) res.send('ERROR: ' + data.diningHall + ' is not a location!');
        else {
            const bridge = await LocationFoodBridge.findOne({
                where: {
                    Date: data.date,
                    Time: data.time,
                    foodId: data.foodId,
                    locationId: location.locationId
                }
            })
            if (bridge === null) res.send('ERROR: No such bridge exists!');
            else {
                await LocationFoodBridge.destroy({
                    where: {
                        Date: data.date,
                        Time: data.time,
                        foodId: data.foodId,
                        locationId: data.locationId
                    }
                });
                res.send('Food successfully removed from location.');
            }
        }
    })();
});

app.post('/deleteFood', (req, res) => {
    (async function createAndSend(){
        const data = req.body;
        const food = await Food.findOne({
            where: {
              foodId: data.foodId
            }
        });
        if (food === null) res.send('ERROR: No such food exists!');
        else {
            await Food.destroy({
                where: {
                  foodId: data.foodId
                }
            });
            await LocationFoodBridge.destroy({
            where: {
                foodId: data.foodId
            } 
            });
            res.send('Food with ID ' + data.foodId + ' Successfully Deleted.')
        }
    })();
});

/*app.get('/createRestriction', (req, res) => {
    (async function createAndSend(){
        let sendVal = await createFoodRestriction('Chicken Soup', 'test restriction');
        res.end(sendVal);
    })();
});*/

app.get('/analysis', (req, res) => {
    (async function getAndSend() {
        const location = await Location.findOne({
            where: {
                locationName: req.query.diningHall
            }
        });
        if (location === null) res.end(req.query.diningHall + ' is not a location!');
        else {
            let resultObj = await findFoodsAtLocationOnDate(location.locationId, req.query.date);
            let str = JSON.stringify(resultObj);
            res.end(str);
        }
    })();
});

app.get('/facts', (req, res) => {
    (async function getAndSend() {
        let food = await findFood('foodId', req.query.foodId);
        if (food === null) res.end('No such item exists!');
        else {
            delete food.foodId;
            let str = JSON.stringify(food);
            res.end(str);
        }
    })();
});

app.listen(port, () => {
    console.log(`app listening at http://localhost:${port}`)
});