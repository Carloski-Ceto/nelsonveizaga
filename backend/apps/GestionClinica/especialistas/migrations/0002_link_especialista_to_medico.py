from django.db import migrations, models
import django.db.models.deletion


def forwards_link_medico(apps, schema_editor):
    Especialista = apps.get_model('especialistas', 'Especialista')
    Medico = apps.get_model('medicos', 'Medico')

    medicos_by_usuario = {m.id_usuario_id: m.id_medico for m in Medico.objects.all()}
    for esp in Especialista.objects.all().iterator():
        medico_id = medicos_by_usuario.get(esp.id_usuario_id)
        if not medico_id:
            medico = Medico.objects.create(
                id_usuario_id=esp.id_usuario_id,
                matricula=f'AUTO-MED-{esp.id_usuario_id}',
                anios_experiencia=0,
                activo=True,
            )
            medico_id = medico.id_medico
            medicos_by_usuario[esp.id_usuario_id] = medico_id

        esp.id_medico_id = medico_id
        esp.save(update_fields=['id_medico'])


def backwards_link_usuario(apps, schema_editor):
    Especialista = apps.get_model('especialistas', 'Especialista')
    for esp in Especialista.objects.select_related('id_medico').all().iterator():
        if esp.id_medico_id:
            esp.id_usuario_id = esp.id_medico.id_usuario_id
            esp.save(update_fields=['id_usuario'])


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ('medicos', '0002_remove_especialidades_medico'),
        ('especialistas', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='especialista',
            name='id_medico',
            field=models.OneToOneField(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                db_column='id_medico',
                related_name='perfil_especialista',
                to='medicos.medico',
            ),
        ),
        migrations.RunPython(forwards_link_medico, backwards_link_usuario),
        migrations.AlterField(
            model_name='especialista',
            name='id_medico',
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.PROTECT,
                db_column='id_medico',
                related_name='perfil_especialista',
                to='medicos.medico',
            ),
        ),
        migrations.RemoveField(
            model_name='especialista',
            name='id_usuario',
        ),
    ]
