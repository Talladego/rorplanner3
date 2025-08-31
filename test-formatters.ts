// Quick test of the formatter functions
import { formatEnumValue, formatCamelCase } from './src/utils/formatters';

console.log('Testing formatEnumValue:');
console.log('MAIN_HAND ->', formatEnumValue('MAIN_HAND'));
console.log('WEAPON_SKILL ->', formatEnumValue('WEAPON_SKILL'));
console.log('SPIRIT_RESISTANCE ->', formatEnumValue('SPIRIT_RESISTANCE'));

console.log('\nTesting formatCamelCase:');
console.log('weaponSkill ->', formatCamelCase('weaponSkill'));
console.log('ballisticSkill ->', formatCamelCase('ballisticSkill'));
console.log('spiritResistance ->', formatCamelCase('spiritResistance'));
