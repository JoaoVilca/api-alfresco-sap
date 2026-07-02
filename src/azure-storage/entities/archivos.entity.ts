import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity('sap_int_digita_doc')
export class ArchivosEntity {

    @PrimaryGeneratedColumn({ type: 'numeric' })
    ID_identificador: string; // o bigint si usas Node 14+

    @Column({type: 'varchar', length: 4, nullable: true})
    Sociedad: string;

    @Column({type: 'varchar', length: 4, nullable: true})
    CAnio: string;

    @Column({type: 'varchar', length: 10, nullable: true})
    Ndocumento: string;

    @Column({type: 'varchar', length: 50, nullable: true})
    Ddocumento: string;

    @Column({type: 'varchar', length: 100, nullable: true})
    IDAlfresco: string;

    @Column({type: 'varchar', length: 255, nullable: true})
    DUrl: string;

    @Column({type: 'varchar', length: 3, nullable: true})
    Clase_Doc: string;

    @Column({type: 'varchar', length: 16, nullable: true})
    Referencia: string;

    @Column({type: 'varchar', length: 2, nullable: true})
    Estado_env: string;

    @Column({type: 'varchar', length: 10, nullable: true})
    codigo_sap: string;

    @Column({type: 'varchar', length: 250, nullable: true})
    texto_sap: string;

    @Column({type: 'varchar', length: 4, nullable: true})
    anio_sap: string;

    @Column({type: 'varchar', length: 12, nullable: true})
    Usuario: string;

    @Column({ type: 'datetime', nullable: true})
    fec_creacion: string;

    @Column({ type: 'datetime', nullable: true})
    fec_modificacion: string;

    @Column({ type: 'datetime', nullable: true})
    fec_activacion: string;

    @Column({ type: 'datetime', nullable: true})
    fec_proceso: string;

    @Column({ type: 'datetime', nullable: true})
    fec_rpta: string;

    @Column({ type: 'varchar', length: 10, nullable: true})
    tdocumento: string;
}