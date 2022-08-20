document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // When submitting an email, use send_mail function to send it and load sent mailbox
  document.querySelector('form').onsubmit = send_mail;

  // By default, load the inbox
  load_mailbox('inbox');
});

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-content').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Show emails in respective mailboxes
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Print emails
    console.log(emails);
    // for each email show the email in its box
    emails.forEach(email => show_mailbox(email, mailbox))
  });
}

function send_mail(){
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })

  .then(response => response.json())
  .then(result => {
    // Print result
    console.log(result);
  })
  localStorage.clear();
  setTimeout(function(){ load_mailbox('sent'); }, 500);
  return false;
}

function show_mailbox(email, mailbox) {
  const emailRow = document.createElement('div');
  emailRow.id = "email";
  emailRow.className = "row";

  const recipient = document.createElement('div');
  recipient.id = "email-recipient";
  recipient.className = "col-lg-3 col-md-3 col-sm-12";
  console.log(`Current mailbox: ${mailbox}`);
  if (mailbox === "inbox") {
    recipient.innerHTML = email.sender;
  } else {
    recipient.innerHTML = email.recipients[0];
  }
  emailRow.append(recipient);

  const subject = document.createElement('div');
  subject.id = "email-subject";
  subject.className = "col-lg-5 col-md-2 col-sm-12";
  subject.innerHTML = email.subject;
  emailRow.append(subject);

  const timestamp = document.createElement('div');
  timestamp.id = "email-timestamp";
  timestamp.className = "col-lg-3 col-md-3 col-sm-12";
  timestamp.innerHTML = email.timestamp;
  emailRow.append(timestamp)


  console.log(mailbox);
  // Archive button
  if(mailbox !== "sent") {
    const button = document.createElement('img');
    button.id = "archive-button";
    button.src = "static/mail/archive.png";
    button.innerHTML = "archived";
    emailRow.append(button);
    button.addEventListener('click', () => archive_email(email.id, email.archived))
  }

  const emailDiv = document.createElement('div');
  emailDiv.id = "email-div";
  if(email.read) {
    emailDiv.className = "read-email";
  } else {
    emailDiv.className = "unread-email";
  }
  emailDiv.append(emailRow);

  recipient.addEventListener('click', () => view_mail(email.id));
  subject.addEventListener('click', () => view_mail(email.id));
  timestamp.addEventListener('click', () => view_mail(email.id));
  document.querySelector('#emails-view').append(emailDiv);
}

function view_mail(email_id) {
  document.querySelector('#email-content').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    // Mark email as read
    read_email(email_id);
    // Print email details
    console.log(email) 
    document.querySelector('#email-content-sender').innerHTML = email.sender;
    document.querySelector('#email-content-recipients').innerHTML = email.recipients;
    document.querySelector('#email-content-subject').innerHTML = email.subject;
    document.querySelector('#email-content-timestamp').innerHTML = email.timestamp;
    document.querySelector('#email-content-body').innerHTML = email.body;

    document.getElementById('reply-button').addEventListener('click', () => reply_mail(email));
  })
  
  return false;

}

function read_email(email_id) {
  console.log(`Email read`);
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
}

function archive_email(email_id, status) {
  const new_status = !status;
  console.log(`The email's archive status: ${new_status}`);
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: new_status
    })
  })
  load_mailbox('inbox');
  window.location.reload();

}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-content').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function reply_mail(email) {
  // Show compose-view
  document.querySelector('#email-content').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Add Re: to subject
  document.querySelector('#compose-recipients').value = email.sender;
  if(email.subject.indexOf('Re: ') === -1) {
    email.subject = "Re: " + email.subject;
  }
  document.querySelector('#compose-subject').value = email.subject;
  document.querySelector("#compose-body").value = `On ${email.timestamp} ${email.sender} wrote:\n\n ${email.body}`;
}
