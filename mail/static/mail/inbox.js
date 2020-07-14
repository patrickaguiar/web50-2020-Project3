document.addEventListener('DOMContentLoaded', function() {

  //Design Funcs
  mainRow = document.querySelector('#main-row');
  navTopHeight = document.querySelector('#nav-top').clientHeight;
  windowHeight = window.innerHeight;
  mainRow.style.height = `${windowHeight - navTopHeight}px`;

  // Use buttons to toggle between views
  document.querySelectorAll('.inbox').forEach(button => {
    button.addEventListener('click', () => load_mailbox('inbox'))
  });
  document.querySelectorAll('.sent').forEach(button => {
    button.addEventListener('click', () => load_mailbox('sent'))
  });
  document.querySelectorAll('.archived').forEach(button => {
    button.addEventListener('click', () => load_mailbox('archive'))
  });
  document.querySelectorAll('.compose').forEach(button => {
    button.addEventListener('click', load_compose_email)
  });

  // By default, load the inbox
  load_mailbox('inbox');
});

/* --------------------------------------------------------------------------------- */
/*CONNECT TO DATABASE*/
/* --------------------------------------------------------------------------------- */

function send_mail(){
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  return fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
}

function get_mail(mailbox){
  return fetch(`/emails/${mailbox}`)
  .then(response => response.json());
}

function get_unique_email(email_id){
  return fetch(`/emails/${email_id}`)
  .then(response => response.json())
}

function read_update(email_id, status){
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: status
    })
  })
}

async function archive_update(email_id, status){
  var init = await fetch(`/emails/${email_id}`, {method: 'PUT', body: JSON.stringify({ archived: status })}); 
  return init
}

/* --------------------------------------------------------------------------------- */
/*CONNECT TO DATABASE*/
/* --------------------------------------------------------------------------------- */

/* --------------------------------------------------------------------------------- */
/*SHOW RESULTS TO THE USER*/
/* --------------------------------------------------------------------------------- */

function load_compose_email() {

  // Show compose view and hide other views
  document.querySelector('#email-page-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('#compose-submit').addEventListener('click', () => {
    send_mail().then(result => {
      console.log(result);
      load_mailbox('inbox');
      if(result.error){
        show_message(result.error, document.querySelector('#emails-alert'));
      }else{
        show_message(result.message, document.querySelector('#emails-alert'));
      }   
    });
  });
}

function load_mailbox(mailbox) {
  // Show the mailbox name
  //document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  document.querySelector('#emails-table').innerHTML = '';
  document.querySelector('#emails-alert').innerHTML = '';

  //Get mails
  get_mail(mailbox).then(result => {
    var counter = 1;
    result.forEach(email => {
      console.log(email);

      //Create Row
      emailRow = document.createElement('tr');
      if(email.read){
        emailRow.className = 'table-info';
      }

      //Create items
      counterRow = document.createElement('th');
      sender = document.createElement('td');
      subject = document.createElement('td');
      timestamp = document.createElement('td');

      //Inner items
      counterRow.innerHTML = counter;
      sender.innerHTML = email.sender;
      subject.innerHTML = email.subject;
      timestamp.innerHTML = email.timestamp

      //Append Cols to Row
      cols = [counterRow, sender, subject, timestamp];
      for(i=0; i<cols.length; i++){
        emailRow.append(cols[i]);
      }

      emailRow.addEventListener('click', () => load_email_page(email.id)); 

      //Append row to mailbox
      document.querySelector('#emails-table').append(emailRow);

      //counter
      counter++;
    });
  });
  
  // Show the mailbox and hide other views
  document.querySelector('#email-page-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
}

function load_email_page(email_id){
  get_unique_email(email_id).then(email => {
    document.querySelector('#email-sender').innerHTML = `${email.sender}`;
    document.querySelector('#email-recipients').innerHTML = `${email.recipients}`;
    document.querySelector('#email-timestamp').innerHTML = `${email.timestamp}`;
    document.querySelector('#email-subject').innerHTML = `${email.subject}`;
    document.querySelector('#email-body').innerHTML = email.body;
  
    read_update(email_id, true);

    const archiveButton = document.querySelector('#archive-button');
    if(email.archived){
      archiveButton.innerHTML = 'Unarchive';
      archiveButton.addEventListener('click', () => {
        archive_update(email_id, false);
        document.location.reload(true);
      });
    }else{
      archiveButton.innerHTML = 'Archive';
      archiveButton.addEventListener('click', () => {
        archive_update(email_id, true);
        document.location.reload(true);
      });
    }

    const replyButton = document.querySelector('#reply-button');
    replyButton.addEventListener('click', () => reply_email(email_id))
  })

  // Show the email page and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-page-view').style.display = 'block';
}

function reply_email(email_id){
  load_compose_email();
  get_unique_email(email_id).then(email => {
    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
  });
}

function show_message(message, page){
  //Create Message Div
  messageDiv = document.createElement('div');
  messageDiv.className = 'alert alert-warning';
  messageDiv.innerHTML = message;

  //Append Message to Page
  page.append(messageDiv);
}

/* --------------------------------------------------------------------------------- */
/*SHOW RESULTS TO THE USER*/
/* --------------------------------------------------------------------------------- */