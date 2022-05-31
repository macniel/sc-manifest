import React, { useState, useEffect, useRef } from "react";
import cx from 'classnames';

import { ReactComponent as SystemIcon } from '../assets/shop-star.svg';
import { ReactComponent as PlanetIcon } from '../assets/shop-planet.svg';
import { ReactComponent as CityIcon } from '../assets/shop-city.svg';
import { ReactComponent as MoonIcon } from '../assets/shop-moon.svg';
import { ReactComponent as StationIcon } from '../assets/shop-station.svg';
import { ReactComponent as ShopIcon } from '../assets/shop-outpost.svg';
import { ReactComponent as ResetIcon } from '../assets/shop-reset.svg';

function ShopSelector({ onChange, refreshToken, defaultShop }) {
  const [path, setPath] = useState([{
    code: "ST",
    name: "Stanton",
    type: "system"
  }]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [internalPath, setInternalPath] = useState(path);
  const [outposts, setOutposts] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [selection, setSelection] = useState({});
  const dialogRef = useRef();
  
  const getShopData = async (shopSymbol) => {
    
      return await fetch('/api/shop/' + shopSymbol).then(res => res.json()).then(shop => {
        let shopPath = [];
        for (let i = 0; i < shop.length - 1; ++i) {
          if (shop[i]) {
            shopPath.push({
              code: shop[i].code,
              name: shop[i].name,
              name_short: shop[i].name_short,
              type: shop[i].type
            });
          }
        }
        shopPath.push(shop[shop.length - 1]);
        return shopPath;
      })
    
  }

  useEffect(() => {
    if (defaultShop) {
      const fetchData = async () => {
        const shopPath = await getShopData(defaultShop)
    
        setPath(shopPath);
        setSelectedShop(shopPath[shopPath.length - 1]);
        if (onChange) {
          onChange?.(shopPath[shopPath.length - 1]);
        }
      }
      fetchData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultShop]);
  
  const getSymbol = (of) => {
    switch (of?.toLowerCase()) {
      case 'system': return <SystemIcon />;
      case 'planet': return <PlanetIcon />;
      case 'city': return <CityIcon />;
      case 'satellite':
      case 'moon': return <MoonIcon />;
      case 'station': return <StationIcon />;
      default:
      case 'tradepost': return <ShopIcon />;
    }
  }

  const showShopSelector = (atIndex) => {
    dialogRef.current.showModal();
  }

  const resetShop = () => {
    if (selectedShop === null) {
      showShopSelector(0);
    } else {
      setSelectedShop(null);
      setInternalPath([{
        code: "ST",
        name: "Stanton",
        type: "system"
      }]);
      setPath([]);
      onChange?.(null);
    }
  }

  const updateShopSelection = async() => {
    const symbol = selection;
    if (symbol) {
      const shopPath = await getShopData(symbol);
      setPath(shopPath);
      setSelectedShop(shopPath[shopPath.length - 1]);
    if (onChange) {
        onChange?.(shopPath[shopPath.length - 1]);
    }
    }
  }

  const updateShopSelector = async (downToIndex, optionalPath) => {
    let sliced = optionalPath || internalPath.slice(0, downToIndex + 1);
    setInternalPath(sliced);
    const codified = sliced.map((segment) => segment.code).join('&code[]=');
    const result = await fetch('/api/system/resolve?code[]=' + codified).then(res => res.json());
        
    setBreadcrumbs(result);
    const stringifiedBreadcrumbs = result.map(segment => 'path[]=' + segment.code).join('&');
    fetch('/api/system/?' + stringifiedBreadcrumbs).then(res => res.json()).then(data => {
      if (data.children) {
        setOutposts(data.children);
      } else {
        setOutposts([])
      }
    })
  }

  const updatePath = (newPathSegment) => {
    updateShopSelector(internalPath.length, [...internalPath, newPathSegment]);
  }

  useEffect(() => {
    const fn = async () => {
      const result = await Promise.all(path.map((segment) =>
        fetch('/api/system/resolve?code=' + segment.code).then(res => res.json()).then(res => {
          return {
            code: res.code,
            name: res.name,
            name_short: res.name_short
          }
        })
      ))
    
      setBreadcrumbs(result);
    }
    fetch('/api/system/?' + path.map(segment => 'path[]=' + segment.code).join('&')).then(res => res.json()).then(data => {
      setOutposts(data.children)
    })
    fn();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderOutposts = () => {
    const rValue = outposts.map((outpost, index) =>
      <li key={index + outpost.code} className={cx({ active: outpost.code === selection })} onClick={() => { if (outpost.trade === "1") { setSelection(outpost.code) } else { updatePath(outpost); } }}>{outpost.name}</li>
    );
    return rValue;
  }

  const renderShopButton = (shop, index, array) => {
    if (shop) {
      return <button key={shop.name} onClick={() => showShopSelector(index)} className={cx("shopSelector__shopSelectorButton shopSelectorButton", { "active": selectedShop?.code === shop.code })}>
        {getSymbol(shop.type)}<span>{shop.name_short || shop.name}</span></button>
    }
  }

  return (
    <>
      <dialog ref={dialogRef}>
        <fieldset>
          <legend>Select your Tradepost</legend>
          <ul className="breadcrumb">
            {breadcrumbs.map((breadcrumb, index) => <li key={breadcrumb.name} onClick={() => updateShopSelector(index)}><span>{ breadcrumb.name }</span></li>)}
          </ul>

          <ul className="childrenSelection">
            {path.length > 1 && <li onClick={() => updateShopSelector(path.length - 2)}>..</li>}
            { renderOutposts() }
          </ul>
        

        </fieldset>
        <fieldset className="dialogActions">
          <legend>Actions</legend>
          <button className="button--harmful" onClick={() => { dialogRef.current.close(null); setInternalPath(path) }}>Cancel</button>
          <button className="button--primary" onClick={() => { dialogRef.current.close(); updateShopSelection(internalPath) }}>Select</button>
        </fieldset>
      </dialog >
    <div className="shopSelector">
        {path?.map((pathSegment, index, arr) => renderShopButton(pathSegment, index, arr))}
      <button className="shopSelector__shopSelectorButton shopSelectorButton" style={{"float": "right"}} onClick={resetShop}>
        <ResetIcon/></button>
      <span className="shopSelector__selected-shop-name selected-shop-name">{selectedShop?.name ?? 'none'}</span>
      </div>
      </>
  );
}

export default ShopSelector;
