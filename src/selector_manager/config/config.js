module.exports = {

  // Style prefix
  stylePrefix: 'clm-',

  // Default selectors
  selectors: [],

  // Label for selectors
  label: 'Classes',

  // Label for states
  statesLabel: '- State -',

  selectedLabel: 'Selected',

  // States
  states: [
      { name: 'hover', label: 'Hover' },
      { name: 'active', label: 'Click' },
      { name: 'nth-of-type(2n)', label: 'Even/Odd' }
  ],
  
  advanceMode: {
	enable: true,
	
	// Label for appliesto state
	appliestoLabel: 'Applies To',
	
	//Optional, If not provided default 'label' will be used
	behaviourLabel: 'Behaviour',
	//Optional, If not provided default 'statesLabel' will be used
	behaviourStatesDefaultOptionLabel: 'Static',
	//Optional, If true, only default state will be applied, i.e. no states
	useDefaultBehaviour: true,
  
	// Appliesto labels
	appliestoOptionItemLabel: 'Selected Item',
	appliestoOptionCustomGroupLabel: 'Custom Group',
  
	resetItemStylesLabel: 'Reset Styles',
	
	removeCustomGroupDialogTitle: 'Remove Custom Group Style',
	removeCustomGroupFromSelectedItemLable: 'From Current Item',
	removeCustomGroupFromAllItemLable: 'From All Items',
  },
  
};
