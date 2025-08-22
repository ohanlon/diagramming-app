import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//import { faExpand, faCompress, faPlus, faMinus } from '@fortawesome/free-regular-svg-icons';
import { } from '@fortawesome/free-solid-svg-icons';
import { v4 as uuidv4 } from 'uuid';

declare global {
  // Re-export FontAwesome types
  export { FontAwesomeIcon };
  // export { faExpand, faCompress, faPlus, faMinus };

  // Re-export uuid types
  export { uuidv4 };
}