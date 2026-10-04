import {defineConfig} from 'sanity';
import {structureTool} from 'sanity/structure';
import {schemaTypes} from './sanity/schema';
export default defineConfig({name:'twinned',title:'Twinned Adventures',projectId:process.env.SANITY_PROJECT_ID || '',dataset:process.env.SANITY_DATASET || 'production',plugins:[structureTool()],schema:{types:schemaTypes}});
