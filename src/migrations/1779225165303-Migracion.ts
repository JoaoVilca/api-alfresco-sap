import { MigrationInterface, QueryRunner } from "typeorm";

export class Migracion1779225165303 implements MigrationInterface {
    name = 'Migracion1779225165303'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sap_int_digita_doc" ("ID_identificador" numeric NOT NULL IDENTITY(1,1), "Sociedad" varchar(4), "CAnio" varchar(4), "Ndocumento" varchar(10), "Ddocumento" varchar(50), "IDBlob" varchar(100), "DUrl" varchar(255), "Clase_Doc" varchar(3), "Referencia" varchar(16), "Estado_env" varchar(2), "codigo_sap" varchar(10), "texto_sap" varchar(250), "anio_sap" varchar(4), "Usuario" varchar(12), "fec_creacion" datetime, "fec_modificacion" datetime, "fec_activacion" datetime, "fec_proceso" datetime, "fec_rpta" datetime, "tdocumento" varchar(10), CONSTRAINT "PK_771bece8e7da287dde9e9a315d1" PRIMARY KEY ("ID_identificador"))`);
        await queryRunner.query(`ALTER TABLE "sap_int_digita_doc" DROP COLUMN "IDBlob"`);
        await queryRunner.query(`ALTER TABLE "sap_int_digita_doc" ADD "IDBlob" varchar(100)`);
        await queryRunner.query(`ALTER TABLE "sap_int_digita_doc" ADD "IDAlfresco" varchar(100)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sap_int_digita_doc" DROP COLUMN "IDAlfresco"`);
        await queryRunner.query(`ALTER TABLE "sap_int_digita_doc" DROP COLUMN "IDBlob"`);
        await queryRunner.query(`ALTER TABLE "sap_int_digita_doc" ADD "IDBlob" varchar(100)`);
        await queryRunner.query(`DROP TABLE "sap_int_digita_doc"`);
    }
}
