import { useState, useEffect } from "preact/hooks";
import styles from "./app.module.css";

export type Card = {
  oracle_id: string;
  name: string;
  mv: number;
  image: string;
  scryfall_uri: string;
  casting_costs: number[];
  mana_costs: string[];
};

const numericalSort = (a: number, b: number) => a - b;

export const CardsForm = () => {
  const [mv, setMv] = useState(-1);
  const [castingCost, setCastingCost] = useState(-1);
  const [cards, setCards] = useState<Card[]>([]);
  const [mvValues, setMvValues] = useState<number[]>([]);
  const [castingCostValues, setCastingCostValues] = useState<number[]>([]);

  useEffect(() => {
    const getData = async () => {
      fetch("/split_cards.json")
        .then((response) => response.text())
        .then((response) => {
          // Heh - convert new-line delimited JSON objects into an array.
          const cardsJson = `[${response.split("\n").join(",")}]`.replace(
            /,]$/,
            "]"
          );
          console.log(cardsJson);
          const cards = JSON.parse(cardsJson) as Card[];
          setCards(cards);

          setMvValues(
            Array.from(new Set(cards.map((card) => card.mv))).sort(
              numericalSort
            )
          );
          setCastingCostValues(
            Array.from(
              new Set(
                cards
                  .map((card) => card.casting_costs)
                  .flatMap((castingCosts) => castingCosts)
              )
            ).sort(numericalSort)
          );
        })
        .catch((err) => console.error(err));
    };
    getData();
  }, [setMvValues, setCastingCostValues, setCards]);

  if (
    cards.length === 0 ||
    mvValues.length === 0 ||
    castingCostValues.length === 0
  ) {
    return <div>Loading...</div>;
  }
  return (
    <form>
      <label>
        Base Card Mana Value (MV):
        <select
          onChange={(e) =>
            setMv(parseInt((e.target as HTMLSelectElement).value))
          }
        >
          <option value="-1">Select MV</option>
          {mvValues.map((x) => (
            <option value={x}>{x}</option>
          ))}
        </select>
      </label>
      <label>
        Casting Cost:
        <select
          onChange={(e) =>
            setCastingCost(parseInt((e.target as HTMLSelectElement).value))
          }
        >
          <option value="-1">Select Casting Cost</option>
          {castingCostValues.map((x) => (
            <option value={x}>{x}</option>
          ))}
        </select>
      </label>
      {mv >= 0 && castingCost >= 0 && (
        <Cards mv={mv} castingCost={castingCost} cards={cards} />
      )}
    </form>
  );
};

type CardsProps = {
  mv: number;
  castingCost: number;
  cards: Card[];
};

export const Cards = (props: CardsProps) => {
  const { mv, castingCost, cards } = props;

  const [filteredCards, setFilteredCards] = useState<Card[]>([]);

  useEffect(() => {
    if (mv < 0 || castingCost < 0) {
      setFilteredCards([]);
    }
    setFilteredCards(
      cards.filter((card) => {
        return card.mv === mv && card.casting_costs.includes(castingCost);
      })
    );
  }, [mv, castingCost, cards]);

  if (filteredCards.length === 0) {
    return <div>No matching cards found</div>;
  } else {
    return (
      <>
        <h2>Matching Cards</h2>
        <ul class={styles.cardList}>
          {filteredCards.map((card) => (
            <li class="card" key={card.oracle_id}>
              <a href={card.scryfall_uri}>
                {card.name}
                <img src={card.image} alt={card.name} />
              </a>
            </li>
          ))}
        </ul>
      </>
    );
  }
};
