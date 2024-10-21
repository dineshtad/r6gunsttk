import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Modal, Button } from 'react-bootstrap';
import './Main.css'; // Import your custom CSS

function Main() {
  const [showModal, setShowModal] = useState(false);

  const [gunData, setGunData] = useState([]); // Holds the sorted or unsorted data
  const [originalGunData, setOriginalGunData] = useState([]); // Keeps the original data for default sorting
  const [applyExtendedBarrel, setApplyExtendedBarrel] = useState(false); // Checkbox state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'default' }); // Sorting config
  const [gunSearch, setGunSearch] = useState(''); // Gun Name search state
  const [operatorSearch, setOperatorSearch] = useState(''); // Operator search state

  useEffect(() => {
    // Load the CSV file from the public folder
    fetch(`${process.env.PUBLIC_URL}/gunlist.csv`)
      .then((response) => response.text())
      .then((csvData) => {
        // Parse the CSV data
        Papa.parse(csvData, {
          header: true,
          complete: (result) => {
            const cleanedData = result.data.filter(
              (row) => row.GunName && row.Operators && row.Damage && row.FireRate
            );
            setGunData(cleanedData);
            setOriginalGunData(cleanedData); // Store the original order of the data
          },
        });
      });
  }, []);

  // Effect to reapply sorting when the Extended Barrel checkbox is toggled
  useEffect(() => {
    if (sortConfig.key && sortConfig.direction !== 'default') {
      handleSort(sortConfig.key, sortConfig.direction); // Reapply sorting with the current config when the checkbox changes
    }
  }, [applyExtendedBarrel]);

  // Filtered data based on search inputs
  const filteredGunData = gunData.filter((gun) => {
    return (
      gun.GunName.toLowerCase().includes(gunSearch.toLowerCase()) &&
      gun.Operators.toLowerCase().includes(operatorSearch.toLowerCase())
    );
  });

  // Sorting logic
  const handleSort = (key, directionOverride = null) => {
    let direction = directionOverride || 'ascending';
    if (!directionOverride && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (!directionOverride && sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'default'; // Cycle back to default (original order)
    }

    setSortConfig({ key, direction });

    if (direction === 'default') {
      setGunData(originalGunData); // Return to original order
    } else {
      const sortedData = [...gunData].sort((a, b) => {
        const aData = calculateExtraColumns(parseFloat(a.Damage), parseFloat(a.FireRate));
        const bData = calculateExtraColumns(parseFloat(b.Damage), parseFloat(b.FireRate));

        const aVal = key in aData ? parseFloat(aData[key]) : a[key];
        const bVal = key in bData ? parseFloat(bData[key]) : b[key];

        // For "Gun Name" and "Operators" columns, use localeCompare for string sorting
        if (key === 'GunName' || key === 'Operators') {
          return direction === 'ascending'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        // For numeric columns (integers or decimals), perform numeric sorting
        if (!isNaN(aVal) && !isNaN(bVal)) {
          return direction === 'ascending' ? aVal - bVal : bVal - aVal;
        }

        // Fallback if data is missing or incorrect
        return 0;
      });
      setGunData(sortedData);
    }
  };

  // Calculate additional values, optionally applying the extended barrel modifier
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
    // Show both triangles when in default sort state
    return ' ▲▼';
  };  

  return (
<div className="container-fluid my-5"> {/* Changed to container-fluid to make the container take full width */}

  <h1 className="text-center mb-4">Rainbow Six Siege Gun TTK (Time to Kill) Table</h1>
  <div className="text-right">
    <a href="#" onClick={() => setShowModal(true)}>How this works</a>
  </div>
  <br></br>


  {/* Search inputs for Gun Name and Operators */}
  <div className="d-flex justify-content-center mb-4">
    <div className="form-group" style={{ marginRight: '10px' }}>
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

  {/* Checkbox to apply extended barrel */}
  <div className="d-flex justify-content-center mb-4">
    <div className="form-check">
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
  </div>

  {/* Table with full width */}
  <table className="table table-striped table-bordered" style={{ width: '80%' }}>
  <thead className="thead-dark">
    <tr>
      <th style={{ width: '150px', height: '50px' }} onClick={() => handleSort('GunName')}>
        <div className="header-container">
          <span>Gun Name</span>
          <span className="sort-icons">{getSortIcon('GunName')}</span>
        </div>
      </th>
      <th style={{ width: '200px', height: '50px' }} onClick={() => handleSort('Operators')}>
        <div className="header-container">
          <span>Operators</span>
          <span className="sort-icons">{getSortIcon('Operators')}</span>
        </div>
      </th>
      <th style={{ width: '100px', height: '50px' }} onClick={() => handleSort('Damage')}>
        <div className="header-container">
          <span>Damage</span>
          <span className="sort-icons">{getSortIcon('Damage')}</span>
        </div>
      </th>
      <th style={{ width: '150px', height: '50px' }} onClick={() => handleSort('FireRate')}>
        <div className="header-container">
          <span>Fire Rate</span>
          <span className="sort-icons">{getSortIcon('FireRate')}</span>
        </div>
      </th>
      <th style={{ width: '100px', height: '50px' }} onClick={() => handleSort('dps')}>
        <div className="header-container">
          <span>DPS</span>
          <span className="sort-icons">{getSortIcon('dps')}</span>
        </div>
      </th>
      <th style={{ width: '150px', height: '50px' }} onClick={() => handleSort('bulletsToKillOne')}>
        <div className="header-container">
          <span>Bullets to Kill One Armor</span>
          <span className="sort-icons">{getSortIcon('bulletsToKillOne')}</span>
        </div>
      </th>
      <th style={{ width: '150px', height: '50px' }} onClick={() => handleSort('bulletsToKillTwo')}>
        <div className="header-container">
          <span>Bullets to Kill Two Armor</span>
          <span className="sort-icons">{getSortIcon('bulletsToKillTwo')}</span>
        </div>
      </th>
      <th style={{ width: '150px', height: '50px' }} onClick={() => handleSort('bulletsToKillThree')}>
        <div className="header-container">
          <span>Bullets to Kill Three Armor</span>
          <span className="sort-icons">{getSortIcon('bulletsToKillThree')}</span>
        </div>
      </th>
      <th style={{ width: '150px', height: '50px' }} onClick={() => handleSort('ttkOne')}>
        <div className="header-container">
          <span>TTK 1 Armor</span>
          <span className="sort-icons">{getSortIcon('ttkOne')}</span>
        </div>
      </th>
      <th style={{ width: '150px', height: '50px' }} onClick={() => handleSort('ttkTwo')}>
        <div className="header-container">
          <span>TTK 2 Armor</span>
          <span className="sort-icons">{getSortIcon('ttkTwo')}</span>
        </div>
      </th>
      <th style={{ width: '150px', height: '50px' }} onClick={() => handleSort('ttkThree')}>
        <div className="header-container">
          <span>TTK 3 Armor</span>
          <span className="sort-icons">{getSortIcon('ttkThree')}</span>
        </div>
      </th>
    </tr>
  </thead>
    <tbody>
      {filteredGunData.map((gun, index) => {
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
            <td style={{ width: '150px', height: '50px' }}>{gun.GunName}</td>
            <td style={{ width: '200px', height: '50px' }}>{gun.Operators}</td>
            <td style={{ width: '100px', height: '50px' }}>{adjustedDamage}</td>
            <td style={{ width: '150px', height: '50px' }}>{gun.FireRate}</td>
            <td style={{ width: '100px', height: '50px' }}>{dps}</td>
            <td style={{ width: '150px', height: '50px' }}>{bulletsToKillOne}</td>
            <td style={{ width: '150px', height: '50px' }}>{bulletsToKillTwo}</td>
            <td style={{ width: '150px', height: '50px' }}>{bulletsToKillThree}</td>
            <td style={{ width: '150px', height: '50px' }}>{ttkOne}</td>
            <td style={{ width: '150px', height: '50px' }}>{ttkTwo}</td>
            <td style={{ width: '150px', height: '50px' }}>{ttkThree}</td>
          </tr>
        );
      })}
    </tbody>
  </table>

      {/* Modal using react-bootstrap */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>How This Works</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>This is how values are calculated...</p>
          <p><strong>Extended Barrel effect</strong>: Damage * 1.12 (Rounded down)</p>
          <p><strong>DPS</strong>: Damage per second, calculated as (Damage * Fire Rate) / 60</p>
          <p><strong>Bullets to Kill 1 Armor</strong>: 100 / Damage (Rounded up)</p>
          <p><strong>Bullets to Kill 2 Armor</strong>: 110 / Damage (Rounded up)</p>
          <p><strong>Bullets to Kill 3 Armor</strong>: 125 / Damage (Rounded up)</p>
          <p><strong>TTK 1 Armor</strong>: (<i>Bullets to Kill 1 Armor</i> - 1) / (Fire Rate / 60)</p>
          <p><strong>TTK 2 Armor</strong>: (<i>Bullets to Kill 2 Armor</i> - 1) / (Fire Rate / 60)</p>
          <p><strong>TTK 3 Armor</strong>: (<i>Bullets to Kill 3 Armor</i> - 1) / (Fire Rate / 60)</p>

          <p><strong>Note</strong>: This assumes every bullet is shot to the enemy's chest (not arms or legs, as shooting here would lower 
            the damage) AND that the bullet is shot within 25 m (damage dropoff happens at any farther distance)</p>

            <p><strong>Source code</strong>: <a href="https://github.com/Dinesh-Tadepalli/R6GunsTTK" target="_blank">https://github.com/Dinesh-Tadepalli/R6GunsTTK</a></p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>



</div>


  );
}

export default Main;

