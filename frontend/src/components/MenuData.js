import { Link} from "react-router-dom"
import React, {useState, useEffect} from 'react'
import styled from 'styled-components'
import {IconContext} from 'react-icons'
import {BsChevronDown, BsChevronUp} from 'react-icons/bs'
import Modal from './Modal'

const AccordionSection = styled.div`
display: flex;
flex-direction: column;
align-items: stretch;
justify-content: center;
position: relative;
height: 100vh;
background: #fff;
`;
const Container = styled.div`
top: 30%;
box-shadow: 2px 10px 35px 1px rgba(153,153,153,0.3);
`;
const Wrap = styled.div`
flex-direction: row;
background: maroon;
color: black;
display: flex;
justify-content: space-between;
align-items: center;
width: 100%;
cursor: pointer;
border-top : 2px solid;
border-bottom: 2px solid;
border-left: 2px solid;
border-right: 2px solid;
h1 {
    padding: 2rem;
    font-size: 2rem;
    color: white;
}
span {
    margin: 2em;
}
`;

const ChosenItemsContainer = styled.div`
    display: flex;
`

const ChosenItem = styled.div`
    padding: 10px;
    border: 1px solid black;
`

const Dropdown = styled.div`
background: white;
color: black;
border-bottom: 1px solid black;
border-top: 1px solid black;
border-left: 1px solid;
border-right: 1px solid;
max-height: 300px;
overflow-y: scroll;
overflow-x: hidden;
align-items: start;
`;


const Menu = styled.div`


`;

const FCard = styled.div`
`;

const FContent= styled.div`
`;

const RecipeContent = styled.div`
`;

const Plate = styled.div`
text-align: center;
`;
const Recipe = styled.div`
display: flex;
justify-content: center;
align-items: center;
color: black;
margin:30px;
`;

const Category = styled.div`
padding: 25px;
background-color: lightgray;
`;
const BUTTON_WRAPPER_STYLES={
    position: 'relative',
    zIndex: 1
}

const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    const currentDate = `${year}-${month}-${day}`;
    return currentDate;
}

const MealCard = ({mdata, afunc, dfunc}) => {
    // states
    const [isOpen, setIsOpen] = useState(false);
    const [modelContent, setModelContent] = useState({});

    const itemFacts = (item) => {
        return (
            <itemProps>
                <p>Calories: {item.calories}</p>
                <p>Carbs: {item.carbs}</p>
                <p>Fat: {item.fat}</p>
                <p>Protein: {item.protein}</p>
            </itemProps>
        )
    }


    const setModalContent = async (item) => {
        try {
            let name = item.name;
            console.log(name);
            let response = await fetch(`http://localhost:3001/getFoodIdFromName?name=${name}`);
            console.log("response is", response);
            let data = await response.json();
            response = await fetch(`http://localhost:3001/facts?foodId=${data}`);
            data = await response.json();
            let facts = {"calories" : data.calories, "carbs" : data.carbs, "fat" : data.fat, "protein" : data.protein};
            console.log(facts);
            setModelContent(facts);
            return facts;
          } catch (error) {
            console.error(error);
          }
        };




    return (
        <FContent >
            { mdata.map((_, i) => {
                return (
                <FCard key={i}>
                    <Category><u>{_.category}</u></Category>

                    <RecipeContent>
                        {_.recipes.map((item,idx) => (
                            <Recipe key={idx}>
                                    <h1>{item.name}</h1>
                                    <button onClick = {() => afunc(item)} >Add</button>
                                    <button onClick = {() => dfunc(item)} >Del</button>

                                <div style={BUTTON_WRAPPER_STYLES}>
                                    <button
                                        onClick={()=>{setIsOpen(true); setModalContent(item)}}>
                                        Info
                                    </button>
                                </div>
                            </Recipe>
                        ))}
                        <Modal open={isOpen} onClose={()=>setIsOpen(false)}>
                            {itemFacts(modelContent)}
                        </Modal>
                    </RecipeContent>
                </FCard>
              )})
            }
     </FContent>
    )
}



const MenuData = ({hall}) => {
    const [clicked, setClicked] = useState(false);
    const [todayMeals, setTodayMeals] = useState({});
    const [chosenItems, setChosenItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const toggle = index => {
        if(clicked === index) {
            // if clicked question is already active, then close
            return setClicked(null)
        }
        setClicked(index);
    }
    const addItem = (item) => {
        if (chosenItems.includes(item)) {
            chosenItems.filter((i) => i === item)[0]["count"] += 1;
            let temp = [...chosenItems];
            setChosenItems(temp);
        } else {
            item.count = 1;
            setChosenItems([...chosenItems, item]);
        }
    }
    const delItem = (item) => {
        if (chosenItems.includes(item)) {
            if (chosenItems.filter((i) => i === item)[0]["count"] === 1) {
                setChosenItems(chosenItems.filter((i) => i !== item));
            } else {
                chosenItems.filter((i) => i === item)[0]["count"] -= 1;
            }
        }
    }

    useEffect(() => {
        const backendURL = `http://localhost:3001/analysis?diningHall=${hall}&date=${getTodayDate()}&allergenRestrictions=&nonAllergenRestrictions=`
        fetch(backendURL)
        .then(res => res.json())
        .then(data => {
            setTodayMeals(data);
            setLoading(false);
        })
        .catch(err => console.log(err))
    }, [hall]);

    return (
        <Menu>
            <Plate>
                <h1>{hall}</h1>
                <ChosenItemsContainer>
                    {chosenItems.map((item, index) => {
                        return (
                            <ChosenItem key={index}>
                                <p>{item.name}</p>
                                <p>{item.count}</p>
                            </ChosenItem>
                        )
                    })}
                </ChosenItemsContainer>
                <Link to={{pathname: "/Analysis"}} state={{foods : Object.keys(chosenItems)}}>
                    <button>Build Plate</button>
                </Link>
            </Plate>
            <IconContext.Provider value={{color: 'white', size: '30px'}}>
              <AccordionSection>
                <Container>
                    {loading && <h1>Loading...</h1>}
                    {todayMeals && Object.keys(todayMeals).map((mealName, index) => {
                        return (
                            <div key={index}>
                                <Wrap onClick={() => toggle(index)}>
                                    <h1>{mealName}</h1>
                                    <span>{clicked === index? <BsChevronUp/> : <BsChevronDown/>}</span>
                                </Wrap>
                                {clicked === index ? (
                                <Dropdown>
                                    <MealCard mdata={todayMeals[mealName]} afunc={addItem} dfunc={delItem}/>
                                </Dropdown>
                                ) : null}
                            </div>
                        );
                    })}
                </Container>
              </AccordionSection>
            </IconContext.Provider>
        </Menu>
    )
};

export default MenuData
