import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Modal, Button } from 'react-bootstrap';
import './Main.css'; 

function Main() {
  const [showModal, setShowModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false); 
  const [gunData, setGunData] = useState([]); 
  const [originalGunData, setOriginalGunData] = useState([]); 
  const [applyExtendedBarrel, setApplyExtendedBarrel] = useState(false); 
  const [includePistolsOrRevolvers, setIncludePistols] = useState(false); 
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'default' }); 
  const [gunSearch, setGunSearch] = useState(''); 
  const [gunTypeFilter, setGunTypeFilter] = useState(''); 
  const [operatorSearch, setOperatorSearch] = useState(''); 

  useEffect(() => {
    const savedMode = sessionStorage.getItem('darkMode');
    if (savedMode) {
      setDarkMode(JSON.parse(savedMode)); 
    } else {
      const currentHour = new Date().getHours();

      // Set dark mode if it's past 7 p.m. or before 7 a.m.
      const isNightTime = currentHour >= 19 || currentHour < 7;
      setDarkMode(isNightTime);
      sessionStorage.setItem('darkMode', JSON.stringify(isNightTime));
    }
  }, []);
  
  
  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/gunlist.csv`)
      .then((response) => response.text())
      .then((csvData) => {
        Papa.parse(csvData, {
          header: true,
          complete: (result) => {
            const cleanedData = result.data.filter(
              (row) => row.GunName && row.Operators && row.Damage && row.FireRate
            );
            setGunData(cleanedData);
            setOriginalGunData(cleanedData); 
          },
        });
      });
  }, []);

  // Effect to reapply sorting when the Extended Barrel checkbox is toggled
  useEffect(() => {
    if (sortConfig.key && sortConfig.direction !== 'default') {
      handleSort(sortConfig.key, sortConfig.direction); 
    }
  }, [applyExtendedBarrel]);

  // Automatically check "Include Pistols/Revolvers" checkbox if Pistol or Revolver is selected in the dropdown
  useEffect(() => {
    if (gunTypeFilter === 'Pistol' || gunTypeFilter === 'Revolver') {
      setIncludePistols(true);
    }
  }, [gunTypeFilter]);

  // Filtered data based on search inputs, gun type, and pistol checkbox
  const filteredData = gunData.filter((gun) => {
    const isPistolOrRevolver = 
      (gun.GunType.toLowerCase().includes('pistol') || gun.GunType.toLowerCase().includes('revolver')) &&
      gun.GunType.toLowerCase() !== 'machine pistol';

    const matchesGunType = gunTypeFilter === '' || 
      (gunTypeFilter === 'Machine Pistol'
        ? gun.GunType === 'Machine Pistol'
        : gunTypeFilter === 'Pistol'
          ? gun.GunType.toLowerCase().includes('pistol') && gun.GunType.toLowerCase() !== 'machine pistol'
          : gunTypeFilter === 'Revolver'
          ? gun.GunType.toLowerCase().includes('revolver')
          : gun.GunType.toLowerCase().includes(gunTypeFilter.toLowerCase()));
    
    return (
      gun.GunName.toLowerCase().includes(gunSearch.trim().toLowerCase()) &&
      gun.Operators.toLowerCase().includes(operatorSearch.trim().toLowerCase()) &&
      matchesGunType && 
      (includePistolsOrRevolvers || !isPistolOrRevolver)
    );
  });

  // Sorting logic
  const handleSort = (key, directionOverride = null) => {
    let direction = directionOverride || 'ascending';
    if (!directionOverride && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (!directionOverride && sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'default';
    }
  
    setSortConfig({ key, direction });
  
    if (direction === 'default') {
      setGunData(originalGunData);
    } else {
      const sortedData = [...gunData].sort((a, b) => {
        const aData = calculateExtraColumns(parseFloat(a.Damage), parseFloat(a.FireRate));
        const bData = calculateExtraColumns(parseFloat(b.Damage), parseFloat(b.FireRate));
  
        const aVal = key in aData ? parseFloat(aData[key]) : a[key];
        const bVal = key in bData ? parseFloat(bData[key]) : b[key];
  
        if (key === 'GunName' || key === 'Operators' || key === 'GunType') {
          return direction === 'ascending'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
  
        if (!isNaN(aVal) && !isNaN(bVal)) {
          return direction === 'ascending' ? aVal - bVal : bVal - aVal;
        }
  
        return 0;
      });
      setGunData(sortedData);
    }
  };
  

  const calculateExtraColumns = (damage, fireRate) => {
    const adjustedDamage = applyExtendedBarrel ? Math.floor(damage * 1.12) : damage;
    const dps = (adjustedDamage * (fireRate / 60)).toFixed(4);
    const bulletsToKillOne = Math.ceil(100 / adjustedDamage);
    const bulletsToKillTwo = Math.ceil(110 / adjustedDamage);
    const bulletsToKillThree = Math.ceil(125 / adjustedDamage);
    const ttkOne = ((bulletsToKillOne - 1) / (fireRate / 60)).toFixed(4);
    const ttkTwo = ((bulletsToKillTwo - 1) / (fireRate / 60)).toFixed(4);
    const ttkThree = ((bulletsToKillThree - 1) / (fireRate / 60)).toFixed(4);

    return {
      adjustedDamage,
      dps,
      bulletsToKillOne,
      bulletsToKillTwo,
      bulletsToKillThree,
      ttkOne,
      ttkTwo,
      ttkThree,
    };
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'ascending') return ' ▲';
      if (sortConfig.direction === 'descending') return ' ▼';
    }

    return ' ▲▼';
  };  

  return (
<div className={`${darkMode ? 'dark-mode' : ''}`}> 

<div className="top-bar d-flex justify-content-between">
  <div></div> 
  <Button 
    variant="dark" 
    className="ml-3"
    style={{ marginRight: '20px', marginTop: '0px' }}  
    onClick={() => {
      const newMode = !darkMode;
      setDarkMode(newMode);
      sessionStorage.setItem('darkMode', JSON.stringify(newMode)); // Save the mode to sessionStorage
    }}
  >
    {darkMode ? <i className="bi bi-sun-fill"></i> : <i className="bi bi-moon-fill"></i>} 
    &nbsp;
    {darkMode ? ' Light Mode' : ' Dark Mode'}
  </Button>
</div>

  <h1 className="text-center mb-4">Rainbow Six Siege Gun TTK (Time to Kill) Table</h1>
  <div className="text-right">
    <a href="#" onClick={() => setShowModal(true)}>How this works</a>
  </div>
  <br></br>

  <div className="d-flex justify-content-center filter-container mb-4">
  <div className="form-group">
    <label htmlFor="gunSearch">Search Gun Name:</label>
    <input
      id="gunSearch"
      className="form-control"
      type="text"
      value={gunSearch}
      onChange={(e) => setGunSearch(e.target.value)}
      placeholder="Enter gun name"
    />
  </div>
  <div className="form-group">
    <label htmlFor="gunTypeFilter">Filter Gun Type:</label>
    <select
      id="gunTypeFilter"
      className="form-control"
      value={gunTypeFilter}
      onChange={(e) => setGunTypeFilter(e.target.value)}
    >
      <option value="">All Guns</option>
      <option value="AR">AR</option>
      <option value="SMG">SMG</option>
      <option value="DMR">DMR</option>
      <option value="Slug Shotgun">Slug Shotgun</option>
      <option value="Sniper">Sniper</option>
      <option value="LMG">LMG</option>
      <option value="Machine Pistol">Machine Pistol</option>
      <option value="Pistol">Pistol</option>
      <option value="Revolver">Revolver</option>
    </select>
  </div>
  <div className="form-group">
    <label htmlFor="operatorSearch">Search Operators:</label>
    <input
      id="operatorSearch"
      className="form-control"
      type="text"
      value={operatorSearch}
      onChange={(e) => setOperatorSearch(e.target.value)}
      placeholder="Enter operator name"
    />
  </div>
</div>


  <div className="d-flex justify-content-center mb-4 filter options">
    <div className="form-check" style={{ marginRight: '20px' }}>
      <input
        className="form-check-input"
        type="checkbox"
        id="applyExtendedBarrel"
        checked={applyExtendedBarrel}
        onChange={(e) => setApplyExtendedBarrel(e.target.checked)}
      />
      <label className="form-check-label ml-2" htmlFor="applyExtendedBarrel">
        Apply Extended Barrel
      </label>
    </div>
    <div className="form-check" style={{ marginRight: '20px' }}>
      <input
        className="form-check-input"
        type="checkbox"
        id="includePistols"
        checked={includePistolsOrRevolvers}
        onChange={(e) => setIncludePistols(e.target.checked)}
        disabled={gunTypeFilter === 'Pistol' || gunTypeFilter === 'Revolver'} 
      />
      <label className="form-check-label ml-2" htmlFor="includePistols">
        Include Pistols/Revolvers
      </label>
    </div>
    <div>
      <a
        href="#"
        className="clear-filters"
        onClick={() => {
          setGunSearch('');
          setGunTypeFilter('');
          setOperatorSearch('');
          setIncludePistols(false);
          setApplyExtendedBarrel(false);
        }}
      >
        Clear Filters
      </a>
    </div>
  </div>
  <div className="table-container"> 
  <div className="table-responsive">
  <table className="table table-striped table-bordered" style={{ width: '80%' }}>
    <thead className="thead-dark">
      <tr>
        <th style={{ width: '8%' }} onClick={() => handleSort('GunName')}>
          <div className="header-container">
            <span>Gun&nbsp;Name</span>
            <span className="sort-icons">{getSortIcon('GunName')}</span>
          </div>
        </th>
        <th style={{ width: '8%' }} onClick={() => handleSort('GunType')}>
          <div className="header-container">
            <span>Gun&nbsp;Type</span>
            <span className="sort-icons">{getSortIcon('GunType')}</span>
          </div>
        </th>
        <th style={{ width: '12%' }} onClick={() => handleSort('Operators')}>
          <div className="header-container">
            <span>Operators</span>
            <span className="sort-icons">{getSortIcon('Operators')}</span>
          </div>
        </th>
        <th style={{ width: '5%' }} onClick={() => handleSort('Damage')}>
          <div className="header-container">
            <span>Damage</span>
            <span className="sort-icons">{getSortIcon('Damage')}</span>
          </div>
        </th>
        <th style={{ width: '5%' }} onClick={() => handleSort('FireRate')}>
          <div className="header-container">
            <span>Fire&nbsp;Rate</span>
            <span className="sort-icons">{getSortIcon('FireRate')}</span>
          </div>
        </th>
        <th style={{ width: '5%' }} onClick={() => handleSort('dps')}>
          <div className="header-container">
            <span>DPS</span>
            <span className="sort-icons">{getSortIcon('dps')}</span>
          </div>
        </th>
        <th style={{ width: '8%' }} onClick={() => handleSort('bulletsToKillOne')}>
          <div className="header-container">
            <span>Bullets to Kill One Armor</span>
            <span className="sort-icons">{getSortIcon('bulletsToKillOne')}</span>
          </div>
        </th>
        <th style={{ width: '8%' }} onClick={() => handleSort('bulletsToKillTwo')}>
          <div className="header-container">
            <span>Bullets to Kill Two Armor</span>
            <span className="sort-icons">{getSortIcon('bulletsToKillTwo')}</span>
          </div>
        </th>
        <th style={{ width: '8%' }} onClick={() => handleSort('bulletsToKillThree')}>
          <div className="header-container">
            <span>Bullets to Kill Three Armor</span>
            <span className="sort-icons">{getSortIcon('bulletsToKillThree')}</span>
          </div>
        </th>
        <th style={{ width: '10%' }} onClick={() => handleSort('ttkOne')}>
          <div className="header-container">
            <span>TTK 1 Armor</span>
            <span className="sort-icons">{getSortIcon('ttkOne')}</span>
          </div>
        </th>
        <th style={{ width: '10%' }} onClick={() => handleSort('ttkTwo')}>
          <div className="header-container">
            <span>TTK 2 Armor</span>
            <span className="sort-icons">{getSortIcon('ttkTwo')}</span>
          </div>
        </th>
        <th style={{ width: '10%' }} onClick={() => handleSort('ttkThree')}>
          <div className="header-container">
            <span>TTK 3 Armor</span>
            <span className="sort-icons">{getSortIcon('ttkThree')}</span>
          </div>
        </th>
      </tr>
    </thead>
    <tbody>
      {filteredData.map((gun, index) => {
        const {
          adjustedDamage,
          dps,
          bulletsToKillOne,
          bulletsToKillTwo,
          bulletsToKillThree,
          ttkOne,
          ttkTwo,
          ttkThree,
        } = calculateExtraColumns(parseFloat(gun.Damage), parseFloat(gun.FireRate));

        return (
          <tr key={index}>
            <td style={{ height: '50px' }}>{gun.GunName}</td>
            <td style={{ height: '50px' }}>{gun.GunType}</td>
            <td style={{ height: '50px' }}>{gun.Operators}</td>
            <td style={{ height: '50px' }}>{adjustedDamage}</td>
            <td style={{ height: '50px' }}>{gun.FireRate}</td>
            <td style={{ height: '50px' }}>{dps}</td>
            <td style={{ height: '50px' }}>{bulletsToKillOne}</td>
            <td style={{ height: '50px' }}>{bulletsToKillTwo}</td>
            <td style={{ height: '50px' }}>{bulletsToKillThree}</td>
            <td style={{ height: '50px' }}>{ttkOne} sec</td>
            <td style={{ height: '50px' }}>{ttkTwo} sec</td>
            <td style={{ height: '50px' }}>{ttkThree} sec</td>
          </tr>
        );
      })}
    </tbody>
  </table>
  </div>
  </div>

   <div className="bottom-bar"></div>

   <Modal show={showModal} onHide={() => setShowModal(false)} centered>
      <Modal.Header 
        closeButton 
        className={darkMode ? 'bg-dark text-light' : ''} 
      >
        <Modal.Title>How This Works</Modal.Title>
      </Modal.Header>
      <Modal.Body className={darkMode ? 'bg-dark text-light' : ''}>
        <p>This assumes every bullet is shot to the enemy's chest (not arms or legs, as shooting here would lower 
          the damage) AND that the bullet is shot within 25 meters (damage dropoff happens at any farther distance)</p>
        <p>Also note that not every operator has access to the extended barrel.</p>
        <p>This is how values are calculated...</p>
        <p><strong>Extended Barrel effect</strong>: Damage * 1.12 (Rounded down)</p>
        <p><strong>DPS</strong>: Damage per second, calculated as (Damage * Fire Rate) / 60</p>
        <p><strong>Bullets to Kill 1 Armor</strong>: 100 / Damage (Rounded up)</p>
        <p><strong>Bullets to Kill 2 Armor</strong>: 110 / Damage (Rounded up)</p>
        <p><strong>Bullets to Kill 3 Armor</strong>: 125 / Damage (Rounded up)</p>
        <p><strong>TTK 1 Armor</strong>: (<i>Bullets to Kill 1 Armor</i> - 1) / (Fire Rate / 60)</p>
        <p><strong>TTK 2 Armor</strong>: (<i>Bullets to Kill 2 Armor</i><i> - 1) / (Fire Rate / 60)</i></p>
        <p><strong>TTK 3 Armor</strong>: (<i>Bullets to Kill 3 Armor</i> - 1) / (Fire Rate / 60)</p>

        <p><strong>Source code:</strong> <a href="https://github.com/dineshtad/r6gunsttk" target="_blank">https://github.com/dineshtad/r6gunsttk</a></p>
        <p><strong>Spreadsheet:</strong> <a href="https://docs.google.com/spreadsheets/d/1Akx-yrqD0e62pIBpDJ3FDrhM52LWpjPE7D_9vgTk_6s" target="_blank">https://docs.google.com/spreadsheets/d/1Akx-yrqD0e62pIBpDJ3FDrhM52LWpjPE7D_9vgTk_6s</a></p>
      </Modal.Body>
      <Modal.Footer className={darkMode ? 'bg-dark text-light' : ''}>
        <Button variant="secondary" onClick={() => setShowModal(false)}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>


</div>
  );
}

export default Main;