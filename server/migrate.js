const { sequelize } = require('./src/models');

async function migrate() {
  try {
    console.log('Running migrations...');
    
    await sequelize.getQueryInterface().addColumn('skills', 'package_url', {
      type: sequelize.Sequelize.STRING(500),
      allowNull: true
    }).catch(() => console.log('package_url already exists'));
    
    await sequelize.getQueryInterface().addColumn('skills', 'version', {
      type: sequelize.Sequelize.STRING(20),
      defaultValue: '1.0.0'
    }).catch(() => console.log('version already exists'));
    
    await sequelize.getQueryInterface().addColumn('skills', 'author', {
      type: sequelize.Sequelize.STRING(100),
      allowNull: true
    }).catch(() => console.log('author already exists'));
    
    await sequelize.getQueryInterface().addColumn('skills', 'readme', {
      type: sequelize.Sequelize.TEXT,
      allowNull: true
    }).catch(() => console.log('readme already exists'));
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();